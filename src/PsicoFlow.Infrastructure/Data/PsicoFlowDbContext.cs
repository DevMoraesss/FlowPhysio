using Microsoft.EntityFrameworkCore;
using PsicoFlow.Domain.Entities;

namespace PsicoFlow.Infrastructure.Data;

public class PsicoFlowDbContext : DbContext
{
    public PsicoFlowDbContext(DbContextOptions<PsicoFlowDbContext> options) : base(options)
    {
    }

    public DbSet<User> Users => Set<User>();
    public DbSet<Patient> Patients => Set<Patient>();
    public DbSet<Speciality> Specialities => Set<Speciality>();
    public DbSet<Consultation> Consultations => Set<Consultation>();
    public DbSet<ClinicalRecord> ClinicalRecords => Set<ClinicalRecord>();
    public DbSet<Attachment> Attachments => Set<Attachment>();
    public DbSet<ServiceEvolution> ServiceEvolutions => Set<ServiceEvolution>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // User configuration
        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.Email).IsUnique();
            entity.Property(e => e.Name).IsRequired().HasMaxLength(200);
            entity.Property(e => e.Email).IsRequired().HasMaxLength(200);
            entity.Property(e => e.PasswordHash).IsRequired();
            entity.Property(e => e.Cpf).HasMaxLength(14);
            entity.Property(e => e.Rg).HasMaxLength(20);
            entity.Property(e => e.Phone).HasMaxLength(20);
            
            // Address as owned entity
            entity.OwnsOne(e => e.Address, address =>
            {
                address.Property(a => a.Street).HasMaxLength(200);
                address.Property(a => a.City).HasMaxLength(100);
                address.Property(a => a.State).HasMaxLength(50);
                address.Property(a => a.ZipCode).HasMaxLength(10);
                address.Property(a => a.Neighborhood).HasMaxLength(100);
                address.Property(a => a.Complement).HasMaxLength(100);
            });

            // Many-to-many with Speciality
            entity.HasMany(e => e.Specialities)
                .WithMany(s => s.Users)
                .UsingEntity(j => j.ToTable("UserSpecialities"));
        });

        // Patient configuration
        modelBuilder.Entity<Patient>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(200);
            entity.Property(e => e.Email).HasMaxLength(200);
            entity.Property(e => e.Phone).HasMaxLength(20);

            entity.HasOne(e => e.Psicologo)
                .WithMany(u => u.Patients)
                .HasForeignKey(e => e.PsicologoId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.Responsible)
                .WithMany()
                .HasForeignKey(e => e.ResponsibleId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        // Speciality configuration
        modelBuilder.Entity<Speciality>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(100);
            entity.Property(e => e.Description).HasMaxLength(500);
        });

        // Consultation configuration
        modelBuilder.Entity<Consultation>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Location).HasMaxLength(500);
            entity.Property(e => e.Observation).HasMaxLength(2000);

            entity.HasOne(e => e.Patient)
                .WithMany(p => p.Consultations)
                .HasForeignKey(e => e.PatientId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.Psicologo)
                .WithMany(u => u.Consultations)
                .HasForeignKey(e => e.PsicologoId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.Speciality)
                .WithMany(s => s.Consultations)
                .HasForeignKey(e => e.SpecialityId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        // ClinicalRecord configuration
        modelBuilder.Entity<ClinicalRecord>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Summary).HasMaxLength(5000);
            entity.Property(e => e.TherapeuticGoals).HasMaxLength(2000);
            entity.Property(e => e.Observations).HasMaxLength(2000);

            entity.HasOne(e => e.Consultation)
                .WithOne(c => c.ClinicalRecord)
                .HasForeignKey<ClinicalRecord>(e => e.ConsultationId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.Patient)
                .WithMany(p => p.ClinicalRecords)
                .HasForeignKey(e => e.PatientId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // Attachment configuration
        modelBuilder.Entity<Attachment>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.FileName).IsRequired().HasMaxLength(255);
            entity.Property(e => e.FilePath).IsRequired().HasMaxLength(500);
            entity.Property(e => e.ContentType).HasMaxLength(100);

            entity.HasOne(e => e.ClinicalRecord)
                .WithMany(c => c.Attachments)
                .HasForeignKey(e => e.ClinicalRecordId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // ServiceEvolution configuration
        modelBuilder.Entity<ServiceEvolution>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Resume).HasMaxLength(5000);
            entity.Property(e => e.Observation).HasMaxLength(2000);

            entity.HasOne(e => e.Patient)
                .WithMany(p => p.ServiceEvolutions)
                .HasForeignKey(e => e.PatientId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.Psicologo)
                .WithMany()
                .HasForeignKey(e => e.PsicologoId)
                .OnDelete(DeleteBehavior.Restrict);
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
