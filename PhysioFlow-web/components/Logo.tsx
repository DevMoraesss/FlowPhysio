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
 * `unoptimized` desliga o otimizador de imagem do Next para este arquivo.
 * O otimizador falhava com "isn't a valid image" por causa do perfil de cor
 * ICC embutido no JPEG. Para uma logo estatica de tamanho fixo, otimizar nao
 * traz ganho nenhum, entao servir o arquivo direto e mais simples e resolve.
 *
 * Existir como componente evita o que aconteceu com o CPF: a mesma coisa
 * escrita em tres markups diferentes, que depois divergem. Trocar a logo
 * agora e mexer em um arquivo so.
 */
export function Logo({ size = 40, className = "" }: LogoProps) {
    return (
        <Image
            src="/logo-physioflow.jpeg"
            alt="PhysioFlow"
            width={size}
            height={size}
            priority
            unoptimized
            className={className}
        />
    );
}
