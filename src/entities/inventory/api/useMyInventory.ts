import { useAuth } from "@clerk/clerk-react"
import { useQuery } from "@tanstack/react-query"
import { useEffect } from "react"
import { authenticatedClient } from "@/shared/api/client"
import { useInventoryStore } from "../model/store"

export const useMyInventory = () => {
  const { getToken, isLoaded, isSignedIn } = useAuth()
  const syncWithBackend = useInventoryStore((state) => state.syncWithBackend)

  const { data, isLoading, error } = useQuery({
    queryKey: ['myInventory'],
    queryFn: async () => {
      const token = await getToken()
      if (!token) throw new Error("No token")

      const client = authenticatedClient(token)
      const { data, error } = await client.inventory.get()
      if (error) throw error
      return data
    },
    enabled: isLoaded && isSignedIn,
    refetchInterval: 10000,
  })

  useEffect(() => {
    if (data && data.items) {
      syncWithBackend(data as any)
      console.log("Synced Inventory with Store", data)
    }
  }, [data, syncWithBackend])

  return { data, isLoading, error }
}
