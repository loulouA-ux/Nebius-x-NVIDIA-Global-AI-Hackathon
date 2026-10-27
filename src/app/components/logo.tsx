import styles from './logo.module.css';
export default function Logo({size=28,intro=false,loading=false}:{size?:number;intro?:boolean;loading?:boolean}){
 const compact=size<32;
 return <svg data-shiptested-logo="tick-slash" data-compact={compact} className={`${styles.logo} ${intro?styles.intro:''} ${loading?styles.loading:''}`} width={size} height={size} viewBox="0 0 64 64" aria-hidden="true"><g fill="none" stroke="currentColor" strokeWidth={compact?5.6:3} strokeLinecap="round" strokeLinejoin="round" transform={compact?'translate(0 -4)':undefined}>
 <path d="M8 44h48l-6 10H14z"/>{!compact&&<path d="M6 58c3-2 5-2 8 0s5 2 8 0 5-2 8 0 5-2 8 0 5-2 8 0"/>}
 <path className={styles.left} d="M23 20l-8 8 8 8"/><path className={styles.right} d="M41 20l8 8-8 8"/><path data-logo-tick className={styles.tick} pathLength="1" d="M26 33l3.5 5.5L36 14"/>
 </g></svg>;
}
