import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarMenu,
    SidebarMenuItem,
    SidebarMenuButton,
    SidebarFooter,
    SidebarHeader,
    SidebarMenuSub,
    SidebarMenuSubItem,
    SidebarMenuSubButton,
    useSidebar,
} from "@/components/ui/sidebar"
import { Link, useNavigate } from "react-router-dom"
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

import {
    Users,
    ChevronsUpDown,
    ChevronRight,
    WalletMinimal,
    UserRoundPen,
    LayoutDashboard,
    LogOut,
    Ticket,
    Palette
} from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { useOrgSettings } from "@/contexts/OrgSettingsContext"

export function App_Sidebar() {
    const { setOpenMobile } = useSidebar()
    const navigate = useNavigate()
    const { profile, logout } = useAuth()
    const { settings } = useOrgSettings()

    const handleNavigation = () => setOpenMobile(false)
    const handleLogout = async () => {
        await logout()
        navigate("/login")
    }

    const userName = profile?.full_name || "Usuario"
    const userEmail = profile?.email || ""
    const userRole = profile?.role || "user"
    const userInitials = userName.substring(0, 2).toUpperCase()

    return (
        <Sidebar collapsible="icon" className="md:flex">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <DropdownMenu>
                            <SidebarMenuButton
                                size="lg"
                                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                            >
                                <div className="flex size-6 align-center justify-center rounded-lg">
                                    <img src="/helpticketicon.svg" alt="logo" />
                                </div>
                                <div className="grid flex-1 text-left text-sm leading-tight">
                                    <span className="truncate font-semibold">{settings.system_name}</span>
                                    <span className="truncate text-xs">ViperDevs</span>
                                </div>
                            </SidebarMenuButton>
                        </DropdownMenu>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <SidebarGroup>
                    <SidebarMenu>

                        <Collapsible asChild defaultOpen className="group/collapsible">
                            <SidebarMenuItem>
                                <CollapsibleTrigger asChild>
                                    <SidebarMenuButton tooltip="Inicio" asChild>
                                        <Link to="/" onClick={handleNavigation}>
                                            <LayoutDashboard />
                                            <span>Inicio</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </CollapsibleTrigger>
                            </SidebarMenuItem>
                        </Collapsible>

                        {/* Menú de Gestión de Usuarios - Solo Admin */}
                        {userRole === 'admin' && (
                            <Collapsible asChild className="group/collapsible">
                                <SidebarMenuItem>
                                    <CollapsibleTrigger asChild>
                                        <SidebarMenuButton tooltip="Usuarios">
                                            <Users />
                                            <span>Usuarios</span>
                                            <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                                        </SidebarMenuButton>
                                    </CollapsibleTrigger>
                                    <CollapsibleContent>
                                        <SidebarMenuSub>
                                            <SidebarMenuSubItem>
                                                <SidebarMenuSubButton asChild>
                                                    <Link to="/usuarios/gestion" onClick={handleNavigation}>Gestion</Link>
                                                </SidebarMenuSubButton>
                                            </SidebarMenuSubItem>
                                        </SidebarMenuSub>
                                    </CollapsibleContent>
                                </SidebarMenuItem>
                            </Collapsible>
                        )}

                        {/* Menú de Tickets - Visible para todos */}
                        <Collapsible asChild className="group/collapsible">
                            <SidebarMenuItem>
                                <CollapsibleTrigger asChild>
                                    <SidebarMenuButton tooltip="Tickets" asChild>
                                        <Link to={userRole === 'user' || userRole === 'support' ? "/tickets" : "/tickets/gestion"} onClick={handleNavigation}>
                                            <Ticket />
                                            <span>Tickets</span>
                                            {userRole === 'admin' && (
                                                <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                                            )}
                                        </Link>
                                    </SidebarMenuButton>
                                </CollapsibleTrigger>
                                {userRole === 'admin' && (
                                    <CollapsibleContent>
                                        <SidebarMenuSub>
                                            <SidebarMenuSubItem>
                                                <SidebarMenuSubButton asChild>
                                                    <Link to="/tickets/gestion" onClick={handleNavigation}>Gestión</Link>
                                                </SidebarMenuSubButton>
                                            </SidebarMenuSubItem>
                                            <SidebarMenuSubItem>
                                                <SidebarMenuSubButton asChild>
                                                    <Link to="/tickets/metricas" onClick={handleNavigation}>Métricas</Link>
                                                </SidebarMenuSubButton>
                                            </SidebarMenuSubItem>
                                            <SidebarMenuSubItem>
                                                <SidebarMenuSubButton asChild>
                                                    <Link to="/tickets/analiticas" onClick={handleNavigation}>Analiticas</Link>
                                                </SidebarMenuSubButton>
                                            </SidebarMenuSubItem>
                                        </SidebarMenuSub>
                                    </CollapsibleContent>
                                )}
                            </SidebarMenuItem>
                        </Collapsible>

                    </SidebarMenu>
                </SidebarGroup>
            </SidebarContent>

            <SidebarFooter>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <SidebarMenuButton
                                    size="lg"
                                    className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                                >
                                    <Avatar className="h-8 w-8 rounded-lg">
                                        <AvatarFallback className="rounded-lg bg-primary/10 text-primary">{userInitials}</AvatarFallback>
                                    </Avatar>
                                    <div className="grid flex-1 text-left text-sm leading-tight">
                                        <span className="truncate font-semibold">{userName}</span>
                                        <span className="truncate text-xs capitalize text-muted-foreground">
                                            {userRole === 'admin' ? 'Administrador' : userRole === 'support' ? settings.support_role_label : (settings.operator_role_label || settings.user_role_label)}
                                        </span>
                                    </div>
                                    <ChevronsUpDown className="ml-auto size-4" />
                                </SidebarMenuButton>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                                side="bottom"
                                align="end"
                                sideOffset={4}
                            >
                                <DropdownMenuLabel className="p-0 font-normal">
                                    <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                                        <Avatar className="h-8 w-8 rounded-lg">
                                            <AvatarFallback className="rounded-lg bg-primary/10 text-primary">{userInitials}</AvatarFallback>
                                        </Avatar>
                                        <div className="grid flex-1 text-left text-sm leading-tight">
                                            <span className="truncate font-semibold">{userName}</span>
                                            <span className="truncate text-xs">{userEmail}</span>
                                        </div>
                                    </div>
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => navigate('/perfil')}><UserRoundPen className="mr-2 w-4 h-4" /> Perfil</DropdownMenuItem>
                                {userRole === 'admin' && (
                                    <>
                                        <DropdownMenuItem onClick={() => navigate('/personalizacion')}><Palette className="mr-2 w-4 h-4" /> Personalización</DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => navigate('/billing')}><WalletMinimal className="mr-2 w-4 h-4" /> Gestion de Planes</DropdownMenuItem>
                                    </>
                                )}
                                <DropdownMenuItem onClick={handleLogout} className="text-red-500"><LogOut className="mr-2 w-4 h-4" /> Cerrar Sesión</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
        </Sidebar >
    )
}