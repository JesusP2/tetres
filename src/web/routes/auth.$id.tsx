import { createFileRoute } from '@tanstack/react-router'
import { useParams } from '@tanstack/react-router'
import { AuthCard } from "@daveyplate/better-auth-ui"

export const Route = createFileRoute('/auth/$id')({
  component: RouteComponent,
})

function RouteComponent() {
  const { id } = useParams({ from: '/auth/$id' })

  return (
    <main className="container grid place-items-center h-screen m-auto">
      <AuthCard pathname={id} />
    </main>
  )
}
