/**
 * 手写的极简图标集（24×24 线性图标，跟随 currentColor），避免额外依赖。
 */
function Svg({ size = 20, strokeWidth = 1.75, className = '', children, ...rest }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {children}
    </svg>
  )
}

export const PlusIcon = (props) => (
  <Svg {...props}>
    <path d="M12 5v14M5 12h14" />
  </Svg>
)

export const CheckIcon = (props) => (
  <Svg {...props}>
    <path d="M20 6.5 9.2 17.3 4 12.1" />
  </Svg>
)

export const CircleIcon = (props) => (
  <Svg {...props}>
    <circle cx="12" cy="12" r="8.5" />
  </Svg>
)

export const CheckCircleIcon = (props) => (
  <Svg {...props}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M8.4 12.3l2.5 2.5 4.8-5.1" />
  </Svg>
)

export const PencilIcon = (props) => (
  <Svg {...props}>
    <path d="M12.5 20H21" />
    <path d="M16.8 3.9a2.1 2.1 0 0 1 3 3L7.4 19.3 3 20.5l1.2-4.4Z" />
  </Svg>
)

export const TrashIcon = (props) => (
  <Svg {...props}>
    <path d="M3.5 6.5h17" />
    <path d="M9 6.5V4.2h6v2.3" />
    <path d="M18.6 6.5 17.7 20a1.6 1.6 0 0 1-1.6 1.5H7.9A1.6 1.6 0 0 1 6.3 20L5.4 6.5" />
    <path d="M10.2 10.6v6.6M13.8 10.6v6.6" />
  </Svg>
)

export const XIcon = (props) => (
  <Svg {...props}>
    <path d="M18 6 6 18M6 6l12 12" />
  </Svg>
)

export const ChevronLeftIcon = (props) => (
  <Svg {...props}>
    <path d="M15 18 9 12l6-6" />
  </Svg>
)

export const ChevronRightIcon = (props) => (
  <Svg {...props}>
    <path d="M9 18l6-6-6-6" />
  </Svg>
)

export const ChevronDownIcon = (props) => (
  <Svg {...props}>
    <path d="M6 9.5 12 15.5 18 9.5" />
  </Svg>
)

export const CalendarIcon = (props) => (
  <Svg {...props}>
    <rect x="3.2" y="5" width="17.6" height="16" rx="2.4" />
    <path d="M3.2 10h17.6M8.2 3v4M15.8 3v4" />
  </Svg>
)

export const ClockIcon = (props) => (
  <Svg {...props}>
    <circle cx="12" cy="12" r="8.6" />
    <path d="M12 7.2V12l3.2 2" />
  </Svg>
)

export const SunIcon = (props) => (
  <Svg {...props}>
    <circle cx="12" cy="12" r="4.2" />
    <path d="M12 2.6v2.1M12 19.3v2.1M4.4 4.4l1.5 1.5M18.1 18.1l1.5 1.5M2.6 12h2.1M19.3 12h2.1M4.4 19.6l1.5-1.5M18.1 5.9l1.5-1.5" />
  </Svg>
)

export const MoonIcon = (props) => (
  <Svg {...props}>
    <path d="M21 12.9A8.6 8.6 0 1 1 11.1 3a6.7 6.7 0 0 0 9.9 9.9Z" />
  </Svg>
)

export const LockIcon = (props) => (
  <Svg {...props}>
    <rect x="4.5" y="10.2" width="15" height="10.6" rx="2.2" />
    <path d="M8.2 10.2V7.5a3.8 3.8 0 0 1 7.6 0" />
    <path d="M12 14.4v2.2" />
  </Svg>
)

export const UnlockIcon = (props) => (
  <Svg {...props}>
    <rect x="4.5" y="10.2" width="15" height="10.6" rx="2.2" />
    <path d="M8.2 10.2V7.5a3.8 3.8 0 0 1 7.2-1.6" />
    <path d="M12 14.4v2.2" />
  </Svg>
)

export const ImagePlusIcon = (props) => (
  <Svg {...props}>
    <rect x="3.2" y="4.6" width="17.6" height="15" rx="2.4" />
    <circle cx="9" cy="10" r="1.6" />
    <path d="M3.6 17.2 8.5 13l3.4 3 2.6-2.2 3.4 3.2" />
    <path d="M17.4 3.6v4M15.4 5.6h4" />
  </Svg>
)

export const LoaderIcon = ({ className = '', ...props }) => (
  <Svg className={`animate-spin ${className}`} {...props}>
    <path d="M12 3v3.2M12 17.8V21M5.4 5.4l2.3 2.3M16.3 16.3l2.3 2.3M3 12h3.2M17.8 12H21M5.4 18.6l2.3-2.3M16.3 7.7l2.3-2.3" opacity="0.9" />
  </Svg>
)

export const AlertIcon = (props) => (
  <Svg {...props}>
    <path d="M10.3 4.2 2.7 18a2 2 0 0 0 1.7 3h15.2a2 2 0 0 0 1.7-3L13.7 4.2a2 2 0 0 0-3.4 0Z" />
    <path d="M12 9.2v4.2" />
    <path d="M12 16.6h.01" />
  </Svg>
)

export const BoldIcon = (props) => (
  <Svg {...props}>
    <path d="M7 4.6h5.6a3.7 3.7 0 0 1 0 7.4H7Z" />
    <path d="M7 12h6.4a3.7 3.7 0 0 1 0 7.4H7Z" />
  </Svg>
)

export const ItalicIcon = (props) => (
  <Svg {...props}>
    <path d="M18.5 4.5h-8M13.5 19.5h-8M15 4.5 9 19.5" />
  </Svg>
)

export const HeadingIcon = (props) => (
  <Svg {...props}>
    <path d="M6 4.6v14.8M18 4.6v14.8M6 12h12" />
  </Svg>
)

export const ListIcon = (props) => (
  <Svg {...props}>
    <path d="M9 6.2h11M9 12h11M9 17.8h11" />
    <path d="M4.4 6.2h.01M4.4 12h.01M4.4 17.8h.01" strokeWidth="2.4" />
  </Svg>
)

export const QuoteIcon = (props) => (
  <Svg {...props}>
    <path d="M9.5 6.5H6.8A2.3 2.3 0 0 0 4.5 8.8v2.4a2.3 2.3 0 0 0 2.3 2.3h1.4v.6a3.3 3.3 0 0 1-3 3.3" />
    <path d="M19.5 6.5h-2.7a2.3 2.3 0 0 0-2.3 2.3v2.4a2.3 2.3 0 0 0 2.3 2.3h1.4v.6a3.3 3.3 0 0 1-3 3.3" />
  </Svg>
)

export const LinkIcon = (props) => (
  <Svg {...props}>
    <path d="M10.2 13.8a4.6 4.6 0 0 0 6.5 0l2.2-2.2a4.6 4.6 0 0 0-6.5-6.5l-1.1 1.1" />
    <path d="M13.8 10.2a4.6 4.6 0 0 0-6.5 0l-2.2 2.2a4.6 4.6 0 0 0 6.5 6.5l1.1-1.1" />
  </Svg>
)

export const CodeIcon = (props) => (
  <Svg {...props}>
    <path d="M8.4 8 4.4 12l4 4M15.6 8l4 4-4 4" />
  </Svg>
)

export const EyeIcon = (props) => (
  <Svg {...props}>
    <path d="M2.4 12S6 5.3 12 5.3 21.6 12 21.6 12 18 18.7 12 18.7 2.4 12 2.4 12Z" />
    <circle cx="12" cy="12" r="2.9" />
  </Svg>
)

export const NotesIcon = (props) => (
  <Svg {...props}>
    <path d="M6.5 3.5h8.2L19.5 8.3V20a1.6 1.6 0 0 1-1.6 1.6H6.5A1.6 1.6 0 0 1 4.9 20V5.1a1.6 1.6 0 0 1 1.6-1.6Z" />
    <path d="M14.4 3.7v4.8h4.8" />
    <path d="M8.4 12.6h7M8.4 16.4h4.8" />
  </Svg>
)

export const InboxIcon = (props) => (
  <Svg {...props}>
    <path d="M3.4 13.2 6.1 4.9a1.8 1.8 0 0 1 1.7-1.2h8.4a1.8 1.8 0 0 1 1.7 1.2l2.7 8.3" />
    <path d="M3.4 13.2h4.4l1.1 2.2h6.2l1.1-2.2h4.4v5.2a2 2 0 0 1-2 2H5.4a2 2 0 0 1-2-2Z" />
  </Svg>
)
