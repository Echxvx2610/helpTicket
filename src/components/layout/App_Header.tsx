import { LogOut } from "lucide-react"
import { Button } from "../ui/button"

export function App_Header() {
    return (
        <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 w-full">
            <h1 className="text-md font-bold">HelpTicket</h1>
            <Button className="ml-auto" variant="ghost" size="icon">
                <LogOut />
            </Button>
        </header>
    )
}