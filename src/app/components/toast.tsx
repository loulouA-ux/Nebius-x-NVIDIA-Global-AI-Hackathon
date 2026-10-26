'use client';
import {useEffect,useState} from 'react';
export default function Toast({message}:{message:string}){const [show,setShow]=useState(true);useEffect(()=>setShow(true),[message]);return show?<p className="brand-toast" role="status" tabIndex={0} onAnimationEnd={()=>{if(!matchMedia('(prefers-reduced-motion: reduce)').matches)setShow(false);}}>{message}</p>:null;}
