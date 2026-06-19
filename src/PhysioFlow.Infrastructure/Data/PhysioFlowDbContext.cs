using Microsoft.EntityFrameworkCore;
using PhysioFlow.Domain.Entities;

namespace PhysioFlow.Infrastructure.Data;

public class PhysioFlowDbContext : DbContext
{
    public PhysioFlowDbContext(DbContextOptions<PhysioFlowDbContext> options) : base(options)
    {
    }

    public DbSet<User> Users => Set<User>();
    public DbSet<Guardian> Guardians => Set<Guardian>();
    public DbSet<Patient> Patients => Set<Patient>();
    public DbSet<Assessment> Assessments => Set<Assessment>();
    public DbSet<Protocol> Protocols => Set<Protocol>();
    public DbSet<Appointment> Appointments => Set<Appointment>();
    public DbSet<Evolution> Evolutions => Set<Evolution>();
    public DbSet<Attachment> Attachments => Set<Attachment>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // User
        modelBuilder.Entity<User>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasIndex(x => x.Email).IsUnique();
            e.HasIndex(x => x.Cpf).IsUnique();
            e.Property(x => x.FullName).IsRequired().HasMaxLength(200);
            e.Property(x => x.Email).IsRequired().HasMaxLength(200);
            e.Property(x => x.PasswordHash).IsRequired();
            e.Property(x => x.Phone).HasMaxLength(20);
            e.Property(x => x.Cpf).HasMaxLength(14);
            e.Property(x => x.Crefito).HasMaxLength(20);
        });

        // Guardian
        modelBuilder.Entity<Guardian>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasIndex(x => x.Cpf).IsUnique();
            e.Property(x => x.FullName).IsRequired().HasMaxLength(200);
            e.Property(x => x.Phone).IsRequired().HasMaxLength(20);
            e.Property(x => x.Email).HasMaxLength(200);
            e.Property(x => x.ZipCode).IsRequired().HasMaxLength(10);
            e.Property(x => x.State).HasMaxLength(2);
        });

        // Patient
        modelBuilder.Entity<Patient>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasIndex(x => x.Cpf).IsUnique();
            e.Property(x => x.FullName).IsRequired().HasMaxLength(200);
            e.Property(x => x.Cpf).HasMaxLength(14);
            e.Property(x => x.Phone).HasMaxLength(20);
            e.Property(x => x.Email).HasMaxLength(200);
            e.Property(x => x.ZipCode).HasMaxLength(10);
            e.Property(x => x.State).HasMaxLength(2);
            e.Property(x => x.PaymentDay).HasMaxLength(50);
            e.Property(x => x.DefaultSessionValue).HasColumnType("decimal(10,2)");

            e.HasOne(x => x.Physio)
                .WithMany(u => u.Patients)
                .HasForeignKey(x => x.PhysioId)
                .OnDelete(DeleteBehavior.Restrict);

            e.HasOne(x => x.Guardian)
                .WithMany(g => g.Patients)
                .HasForeignKey(x => x.GuardianId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        // Assessment
        modelBuilder.Entity<Assessment>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.AnamnesisAnswers)
                .HasColumnType("jsonb");

            e.HasOne(x => x.Patient)
                .WithMany(p => p.Assessments)
                .HasForeignKey(x => x.PatientId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // Protocol
        modelBuilder.Entity<Protocol>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.TreatmentName).IsRequired().HasMaxLength(200);

            e.HasOne(x => x.Patient)
                .WithMany(p => p.Protocols)
                .HasForeignKey(x => x.PatientId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // Appointment
        modelBuilder.Entity<Appointment>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.SessionValue).HasColumnType("decimal(10,2)");
            e.Property(x => x.Notes).HasMaxLength(1000);

            e.HasOne(x => x.Patient)
                .WithMany(p => p.Appointments)
                .HasForeignKey(x => x.PatientId)
                .OnDelete(DeleteBehavior.Restrict);

            e.HasOne(x => x.Physio)
                .WithMany(u => u.Appointments)
                .HasForeignKey(x => x.PhysioId)
                .OnDelete(DeleteBehavior.Restrict);

            e.HasOne(x => x.Protocol)
                .WithMany(p => p.Appointments)
                .HasForeignKey(x => x.ProtocolId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        // Evolution — relação 1:1 com Appointment
        modelBuilder.Entity<Evolution>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasIndex(x => x.AppointmentId).IsUnique();

            e.HasOne(x => x.Appointment)
                .WithOne(a => a.Evolution)
                .HasForeignKey<Evolution>(x => x.AppointmentId)
                .OnDelete(DeleteBehavior.Restrict);

            e.HasOne(x => x.Patient)
                .WithMany(p => p.Evolutions)
                .HasForeignKey(x => x.PatientId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // Attachment
        modelBuilder.Entity<Attachment>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.FileName).IsRequired().HasMaxLength(255);
            e.Property(x => x.FilePath).IsRequired().HasMaxLength(500);
            e.Property(x => x.ContentType).HasMaxLength(100);

            e.HasOne(x => x.Patient)
                .WithMany(p => p.Attachments)
                .HasForeignKey(x => x.PatientId)
                .OnDelete(DeleteBehavior.SetNull);

            e.HasOne(x => x.Assessment)
                .WithMany(a => a.Attachments)
                .HasForeignKey(x => x.AssessmentId)
                .OnDelete(DeleteBehavior.SetNull);

            e.HasOne(x => x.Evolution)
                .WithMany(ev => ev.Attachments)
                .HasForeignKey(x => x.EvolutionId)
                .OnDelete(DeleteBehavior.SetNull);
        });
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        foreach (var entry in ChangeTracker.Entries<BaseEntity>())
        {
            switch (entry.State)
            {
                case EntityState.Added:
                    entry.Entity.CreatedAt = DateTime.UtcNow;
                    break;
                case EntityState.Modified:
                    entry.Entity.UpdatedAt = DateTime.UtcNow;
                    break;
            }
        }

        return base.SaveChangesAsync(cancellationToken);
    }
}
