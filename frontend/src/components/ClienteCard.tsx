export default function ClienteCard({cliente,onVisitado,onNoVisitado}){

return(

<div style={{
border:"1px solid #eee",
padding:15,
borderRadius:12,
marginBottom:10
}}>

<h3>{cliente.nombre}</h3>

<div style={{display:"flex",gap:10}}>

<button
style={{
flex:1,
background:"#22c55e",
color:"#fff",
padding:10,
borderRadius:8
}}
onClick={()=>onVisitado(cliente)}
>
VISITADO
</button>

<button
style={{
flex:1,
background:"#ef4444",
color:"#fff",
padding:10,
borderRadius:8
}}
onClick={()=>onNoVisitado(cliente)}
>
NO VISITADO
</button>

</div>

</div>

)

}