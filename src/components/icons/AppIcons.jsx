function IconBase({
  children,
  className = '',
  size = 18,
  strokeWidth = 1.9,
  viewBox = '0 0 24 24',
}) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      height={size}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={strokeWidth}
      viewBox={viewBox}
      width={size}
      xmlns="http://www.w3.org/2000/svg"
    >
      {children}
    </svg>
  )
}

function CoffeeIcon(props) {
  return (
    <IconBase {...props}>
      <path d="M10 2v2" />
      <path d="M14 2v2" />
      <path d="M7 8h8a3 3 0 0 1 0 6h-1v1a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4V8h3Z" />
      <path d="M18 8h1a3 3 0 0 1 0 6h-1" />
      <path d="M2 22h14" />
    </IconBase>
  )
}

function HeartIcon(props) {
  return (
    <IconBase {...props}>
      <path d="m12 20.4-1.1-1C5.2 14.2 2 11.2 2 7.5A4.5 4.5 0 0 1 6.5 3 5 5 0 0 1 12 6.1 5 5 0 0 1 17.5 3 4.5 4.5 0 0 1 22 7.5c0 3.7-3.2 6.7-8.9 11.9l-1.1 1Z" />
    </IconBase>
  )
}

function UsersIcon(props) {
  return (
    <IconBase {...props}>
      <path d="M16 21v-1.2A3.8 3.8 0 0 0 12.2 16h-4.4A3.8 3.8 0 0 0 4 19.8V21" />
      <path d="M10 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" />
      <path d="M20 21v-1.2a3.8 3.8 0 0 0-2.8-3.7" />
      <path d="M16.5 4.3a4 4 0 0 1 0 7.4" />
    </IconBase>
  )
}

export {
  CoffeeIcon,
  HeartIcon,
  UsersIcon,
}
