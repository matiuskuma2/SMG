import { css } from "../../../styled-system/css";

type HeaderProps = {
  title: string;
};

export const Header = ({ title }: HeaderProps) => {
  return (
    <div className={css({
      bg: "gray.500",
      p: "3",
      textAlign: "center",
      fontWeight: "bold",
      fontSize: "xl",
      roundedTop: "sm",
      color: "white"
    })}>
      {title}
    </div>
  );
}; 