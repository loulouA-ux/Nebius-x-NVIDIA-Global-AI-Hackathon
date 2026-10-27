"use client";
import styles from './account-ux.module.css';
export default function SkipLink(){return <a className={styles.skip} href="#main-content" onClick={event=>{const main=document.querySelector('main');if(main){event.preventDefault();main.id='main-content';main.tabIndex=-1;main.focus();main.scrollIntoView({block:'start'});}}}>Skip to main content</a>;}
