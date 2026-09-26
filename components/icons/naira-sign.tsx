import { SVGProps } from 'react';

/**
 * Drop-in replacement for lucide-react's DollarSign — same 24x24 viewBox and
 * className/size API — but renders the Naira glyph, since every amount in
 * this app is in Naira.
 */
export function NairaSign({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      {...props}
    >
      <text
        x="12"
        y="17.5"
        textAnchor="middle"
        fontSize="17"
        fontWeight="700"
        fontFamily="ui-sans-serif, system-ui, sans-serif"
        fill="currentColor"
        stroke="none"
      >
        ₦
      </text>
    </svg>
  );
}
