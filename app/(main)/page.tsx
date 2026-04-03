import { Gamepad, GamepadDirectional } from 'lucide-react'
import Link from 'next/link'
import React from 'react'

const ListGame = [
  {
    id: 1,
    name: 'ĐUA XE',
    image: "/image/dua_xe.webp",
    path: "/dua-xe"
  },
  {
    id: 2,
    name: 'RẮN SĂN MỒI',
    image: "/image/ran_san_moi.webp",
    path: "/ran-san-moi"
  },
  {
    id: 3,
    name: 'CỜ CARO',
    image: "/image/co_caro.webp",
    path: "/co-caro"
  },
  {
    id: 4,
    name: 'Flappy Bird',
    image: "/image/flappy_bird.webp",
    path: "/flappy_bird"
  },
  {
    id: 5,
    name: 'Bắn máy bay',
    image: "/image/ban_may_bay.webp",
    path: "/ban-may-bay"
  },

]

export default function page() {
  return (
    <section className='container-x bg-blue-100 min-h-screen'>
      <h1 className='flex items-center gap-4 justify-center text-3xl font-bold text-red-600'><Gamepad size={40}/> DANH SÁCH GAME</h1>
      <div className='flex items-center gap-10 my-10'>
          {ListGame.map(item => (
            <Link href={item.path} key={item.id} className='flex flex-col gap-2 relative shadow-2xl rounded-2xl overflow-hidden'>
              <img src={item.image} alt={item.image} className='w-70 h-70 object-center  object-cover border-white border'/>
              <div className='grid place-content-center absolute top-0 left-0 w-full h-full bg-transparent opacity-0 transition-all hover:opacity-100 hover:bg-blue-100/40'>
                <p className='text-lg font-semibold uppercase bg-amber-50 py-1 px-3 rounded-md text-red-500'>{item.name}</p>
              </div>
            </Link>
          ))}
      </div>
    </section>
  )
}
