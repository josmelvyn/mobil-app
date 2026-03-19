iniciar api
cd backend
node src/server.js 

iniciar proyecto 
cd frontend
npm run dev 

para actualizar la produccion
cd frontend
cd dist
npx vercel --prod

se usa ngrok para la api 
ngrok http 3000 --host-header="localhost:3000"