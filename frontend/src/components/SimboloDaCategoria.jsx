import { desenhoDoSimbolo } from './iconesDePin'

// Mesmo símbolo usado dentro do pin, para legendas e formulários.
// É decorativo: o nome da categoria sempre aparece em texto ao lado.
export default function SimboloDaCategoria({ categoria }) {
  return (
    <svg
      className="simbolo-da-categoria"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: desenhoDoSimbolo(categoria, 0, 0) }}
    />
  )
}
