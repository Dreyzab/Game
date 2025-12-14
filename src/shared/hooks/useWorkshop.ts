import { useAuth } from "@clerk/clerk-react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { authenticatedClient } from "../api/client"

export const useWorkshop = () => {
  const { getToken } = useAuth()
  const queryClient = useQueryClient()

  const repair = useMutation({
    mutationFn: async (itemId: string) => {
      const token = await getToken()
      if (!token) throw new Error("Нет токена")
      const client = authenticatedClient(token)
      const { data, error } = await client.inventory.repair.post({ itemId })
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myInventory'] })
    },
  })

  const upgrade = useMutation({
    mutationFn: async (itemId: string) => {
      const token = await getToken()
      if (!token) throw new Error("Нет токена")
      const client = authenticatedClient(token)
      const { data, error } = await client.inventory.upgrade.post({ itemId })
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myInventory'] })
    },
  })

  return { repair, upgrade }
}





