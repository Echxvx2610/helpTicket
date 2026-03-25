import { Menu } from "lucide-react"
import { Button } from "../ui/button"
import { useSidebar } from "../ui/sidebar"
import { useOrgSettings } from "@/contexts/OrgSettingsContext"

export function App_Header() {
    const { toggleSidebar } = useSidebar()
    const { settings } = useOrgSettings()
    return (
        <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 w-full">
            <Button variant="ghost" size="icon" onClick={toggleSidebar}>
                <Menu />
            </Button>
            <h1 className="text-md font-bold">{settings.system_name}</h1>
        </header>
    )
}