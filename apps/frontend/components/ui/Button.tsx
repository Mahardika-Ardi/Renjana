import { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  content?: string;
  logoName?: string;

  classes?: {
    button?: string;
    logo?: string;
    content?: string;
  };
}

export default function Button({
  content,
  logoName,
  classes,
  ...props
}: ButtonProps) {
  return (
    <button className={classes?.button} {...props}>
      {content && <span className={classes?.content}>{content}</span>}
      {logoName && (
        <span className={`material-symbols-outlined ${classes?.logo}`}>
          {logoName}
        </span>
      )}
    </button>
  );
}
