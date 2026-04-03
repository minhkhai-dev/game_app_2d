'use client'
import CaroGame from '@/game/CaroGame'
import FlappyBird from '@/game/FlappyBird'
import Loading from '@/game/Loading'
import RacingGame from '@/game/RacingGame'
import SnakeGame from '@/game/SnakeGame'
import SpaceShooter from '@/game/SpaceShooter'
import { useParams } from 'next/navigation'
import React from 'react'

export default function page() {
    const {path} = useParams()
    switch (path) {
        case "dua-xe":
            return <RacingGame />
        case "ran-san-moi":
            return <SnakeGame />
        case "co-caro":
            return <CaroGame />
        case "flappy_bird":
            return <FlappyBird />
        case "ban-may-bay":
            return <SpaceShooter />
        default:
            return <Loading />
    }
}
