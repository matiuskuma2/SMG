import { css } from "../../../styled-system/css";

export const Footer = () => {
  return (
    <div className={css({
      mt: "8",
      pt: "4",
      borderTop: "1px solid",
      borderColor: "gray.200",
      textAlign: "center",
      fontSize: "sm",
      color: "gray.600"
    })}>
      <p>お問い合わせは<a href="#" className={css({ color: "blue.500", textDecoration: "underline" })}>こちら</a>まで</p>
      <p>Copyright(c) 2023 株式会社エスアールエスエイコンサルティングアンドプランニング All Rights Reserved.</p>
    </div>
  );
}; 