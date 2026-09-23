import Image from "next/image";

interface LogoProps {
    /** Lado do quadrado em pixels. */
    size?: number;
    /** Classes extras, usadas para controlar o arredondamento em cada tela. */
    className?: string;
}

/**
 * Logo do PhysioFlow.
 *
 * A imagem ja vem com o proprio fundo verde, entao nao precisa de caixa
 * colorida atras nem de sombra colorida: o desenho se sustenta sozinho.
 *
 * O arquivo e PNG e nao JPEG. A logo tem duas cores chapadas, entao o PNG
 * comprime melhor (9 KB contra 101 KB), nao cria sujeira de compressao nas
 * bordas curvas e nao carrega o perfil ICC do Photoshop que fazia o otimizador
 * do Next recusar o arquivo com "isn't a valid image".
 *
 * `unoptimized` desliga o otimizador de imagem do Next para este arquivo.
 * Para uma logo estatica exibida entre 40 e 64 pixels, otimizar nao traz ganho
 * nenhum, entao servir o arquivo direto e mais simples.
 *
 * Existir como componente evita o que aconteceu com o CPF: a mesma coisa
 * escrita em tres markups diferentes, que depois divergem. Trocar a logo
 * agora e mexer em um arquivo so.
 */
export function Logo({ size = 40, className = "" }: LogoProps) {
    return (
        <Image
            src="/logo-physioflow.png"
            alt="PhysioFlow"
            width={size}
            height={size}
            priority
            unoptimized
            className={className}
        />
    );
}
