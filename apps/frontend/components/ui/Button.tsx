import { ButtonHTMLAttributes } from 'react';
import Image from 'next/image';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  content?: string;
  logoName?:
    'visibility' | 'visibility_off' | 'arrow_forward' | 'progress_activity';

  classes?: {
    button?: string;
    logo?: string;
    content?: string;
  };
}

const IconsButton = {
  visibility: '/icons/visibility.svg',
  visibility_off: '/icons/invisible.svg',
  arrow_forward: '/icons/right-arrow.svg',
  progress_activity: '/icons/loading.svg',
};

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
        <Image
          src={IconsButton[logoName]}
          alt={logoName}
          width={25}
          height={25}
          className={classes?.logo}
        />
      )}
    </button>
  );
}
