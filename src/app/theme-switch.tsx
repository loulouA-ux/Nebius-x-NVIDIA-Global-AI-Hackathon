'use client';
import {useEffect,useState} from 'react';
import {Sun,Moon} from 'lucide-react';
import styles from './theme-switch.module.css';
export default function ThemeSwitch({label=false}:{label?:boolean}){
 const [theme,setTheme]=useState('dark');
 useEffect(()=>{const sync=()=>setTheme(document.documentElement.dataset.theme||'dark');sync();const observer=new MutationObserver(sync);observer.observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});return()=>observer.disconnect();},[]);
 const next=theme==='dark'?'light':'dark';
 return <button type="button" className={styles.toggle} aria-label={`Switch to ${next} mode`} onClick={(event)=>{try{localStorage.setItem('shipcheck-theme',next);}catch{}const apply=()=>{document.documentElement.dataset.theme=next;};if(event.detail!==0&&document.startViewTransition&&!matchMedia('(prefers-reduced-motion: reduce)').matches)document.startViewTransition(apply);else apply();}}>{theme==='dark'?<Sun size={18} aria-hidden="true"/>:<Moon size={18} aria-hidden="true"/>}{label&&<span>{next==='light'?'Light mode':'Dark mode'}</span>}</button>;
}
