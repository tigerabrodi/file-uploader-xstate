export function Spinner({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="-0.5 0 24 24"
      className={className}
    >
      <path d="M23.314 8.518V.686l-2.84 2.84A11.962 11.962 0 0 0 11.981.004c-6.627 0-12 5.373-12 12s5.373 12 12 12c4.424 0 8.289-2.394 10.37-5.958l.031-.057-2.662-1.536c-1.57 2.695-4.447 4.478-7.739 4.478a8.927 8.927 0 1 1 6.32-15.232l-2.82 2.82h7.834z" />
    </svg>
  )
}
