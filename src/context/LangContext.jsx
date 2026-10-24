import { createContext, useContext, useState } from 'react';
import T from '../translations';

const LangContext = createContext(null);

export const LangProvider = ({ children }) => {
  const [lang, setLangState] = useState(() => localStorage.getItem('eq-lang') || 'en');

  const t = (key, vars = {}) => {
    let str = T[lang]?.[key] ?? T.en?.[key] ?? key;
    Object.entries(vars).forEach(([k, v]) => {
      str = str.replace(`{${k}}`, v);
    });
    return str;
  };

  const setLang = (l) => {
    setLangState(l);
    localStorage.setItem('eq-lang', l);
  };

  return (
    <LangContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LangContext.Provider>
  );
};

export const useLang = () => useContext(LangContext);
