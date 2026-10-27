'use client';
import {usePathname} from 'next/navigation';
import {useEffect,useRef} from 'react';
export default function RouteFocus(){const pathname=usePathname(),previous=useRef(pathname);useEffect(()=>{if(previous.current===pathname)return;previous.current=pathname;let attempts=0;const id=setInterval(()=>{const heading=document.querySelector<HTMLElement>('main h1');if(heading){heading.tabIndex=-1;heading.focus();clearInterval(id);}else if(++attempts>50)clearInterval(id);},30);return()=>clearInterval(id);},[pathname]);return null;}
