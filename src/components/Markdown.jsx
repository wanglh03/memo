import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

/**
 * Markdown 渲染（GFM）。默认不解析原始 HTML，链接强制新窗口打开，避免 XSS。
 */
export function Markdown({ children, className = '' }) {
  const content = typeof children === 'string' ? children : ''
  if (!content.trim()) return null

  return (
    <div className={`md ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ node, ...props }) => <a {...props} target="_blank" rel="noopener noreferrer" />,
          img: ({ node, alt = '', ...props }) => <img {...props} alt={alt} loading="lazy" />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
