'use client';
import {useEffect,useState} from 'react';
export default function Toast({message}:{message:string}){const [show,setShow]=useState(false);useEffect(()=>{const enter=requestAnimationFrame(()=>setShow(true));const exit=setTimeout(()=>setShow(false),4400);return()=>{cancelAnimationFrame(enter);clearTimeout(exit);};},[message]);return <p className="brand-toast" data-visible={show} role="status">{message}</p>;}
