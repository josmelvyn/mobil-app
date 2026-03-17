export default function Buscador({value,onChange}){

return(

<input
placeholder="Buscar cliente..."
value={value}
onChange={(e)=>onChange(e.target.value)}
style={{
width:"100%",
padding:12,
borderRadius:10,
border:"1px solid #ccc"
}}
/>

)

}