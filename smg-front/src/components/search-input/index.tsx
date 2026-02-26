import { LuSearch } from "react-icons/lu";

import * as style from "./styled";

export const SearchInput = () => (
  <div className={style.container}>
    <LuSearch className={style.icon} />
    <input className={style.field} type="search" placeholder="知りたい内容について聞いてみてください" />
  </div>
);
