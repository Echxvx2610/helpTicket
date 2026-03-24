import { useState, useRef } from "react"
import { supabase } from "@/lib/supabaseClient"
import { useAuth } from "@/hooks/useAuth"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { PlusCircle, Upload, X, FileText, Loader2 } from "lucide-react"

interface CreateTicketDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

const CATEGORIES = [
  "Hardware",
  "Software",
  "Red/Conectividad",
  "Cuenta/Acceso",
  "Otro",
]

const PRIORITIES = [
  { value: "Baja", label: "Baja" },
  { value: "Media", label: "Media" },
  { value: "Alta", label: "Alta" },
  { value: "Urgente", label: "Urgente" },
]

const AREAS = [
  "Administración",
  "Contabilidad",
  "Recursos Humanos",
  "Ventas",
  "Soporte Técnico",
  "Desarrollo",
  "Otro",
]

const DEVICES = [
  "Desktop",
  "Laptop",
  "Servidor",
  "Impresora",
  "Teléfono",
  "Tablet",
  "Red/Router",
  "Otro",
]

export function CreateTicketDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreateTicketDialogProps) {
  const { user, profile } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    titulo: "",
    descripcion: "",
    categoria: "",
    prioridad: "Media",
    area: "",
    dispositivo: "",
  })

  const [attachments, setAttachments] = useState<File[]>([])
  const [uploadingFiles, setUploadingFiles] = useState(false)

  const handleInputChange = (
    field: string,
    value: string
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setError(null)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const validTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ]

    const validFiles = files.filter((file) => {
      const isValidType = validTypes.includes(file.type)
      const isValidSize = file.size <= 10 * 1024 * 1024
      return isValidType && isValidSize
    })

    setAttachments((prev) => [...prev, ...validFiles])
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) {
      setError("Debes estar autenticado para crear un ticket")
      return
    }

    if (!formData.titulo.trim()) {
      setError("El título es obligatorio")
      return
    }

    if (!formData.descripcion.trim()) {
      setError("La descripción es obligatoria")
      return
    }

    if (!formData.categoria) {
      setError("Selecciona una categoría")
      return
    }

    setLoading(true)
    setError(null)

    try {
      if (!profile?.organization_id) {
        throw new Error("No se encontró la organización del usuario")
      }

      // Appending device to description if specified since there's no device column
      const fullDescription = formData.dispositivo 
        ? `${formData.descripcion}\n\n[Dispositivo reportado: ${formData.dispositivo}]`
        : formData.descripcion;

      const { data: ticket, error: ticketError } = await supabase
        .from("tickets")
        .insert({
          organization_id: profile.organization_id,
          title: formData.titulo,
          description: fullDescription,
          type: formData.categoria,
          priority: formData.prioridad,
          location: formData.area || null,
          created_by: user.id,
          status: "Abierto",
        })
        .select()
        .single()

      if (ticketError) throw ticketError

      if (attachments.length > 0) {
        setUploadingFiles(true)
        const uploadedUrls: { url: string; file: File }[] = []

        for (const file of attachments) {
          const fileName = `${ticket.id}/${Date.now()}_${file.name}`
          const { data, error } = await supabase.storage
            .from("ticket-attachments")
            .upload(fileName, file)

          if (error) {
            console.error("Storage upload error:", error)
            throw new Error(`Bucket Storage Error (${file.name}): Asegúrate de configurar las políticas RLS del bucket ticket-attachments. Detalle: ${error.message}`)
          }

          if (data) {
            const { data: urlData } = supabase.storage
              .from("ticket-attachments")
              .getPublicUrl(fileName)
            uploadedUrls.push({ url: urlData.publicUrl, file })
          }
        }

        if (uploadedUrls.length > 0) {
          const { error: insertError } = await supabase.from("ticket_attachments").insert(
            uploadedUrls.map(({ url, file }) => ({
              organization_id: profile.organization_id,
              ticket_id: ticket.id,
              uploaded_by: user.id,
              file_url: url,
              file_name: file.name,
              file_size: file.size,
            }))
          )
          
          if (insertError) {
             throw new Error(`Error al guardar referencias de adjuntos en la base de datos: ${insertError.message}`)
          }
        }
        setUploadingFiles(false)
      }

      setFormData({
        titulo: "",
        descripcion: "",
        categoria: "",
        prioridad: "Media",
        area: "",
        dispositivo: "",
      })
      setAttachments([])

      if (onSuccess) {
        onSuccess()
      }

      onOpenChange(false)
    } catch (err: any) {
      setError(err.message || "Error al crear el ticket")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto sm:rounded-2xl">
        <DialogHeader className="border-b pb-4 mb-2">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-xl">
              <PlusCircle className="w-6 h-6 text-primary" />
            </div>
            <div className="text-left">
              <DialogTitle className="text-xl font-bold text-gray-800">Crear Nuevo Ticket</DialogTitle>
              <DialogDescription className="text-sm mt-1">
                Completa los detalles de tu solicitud de soporte técnico
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="titulo">Título *</Label>
            <Input
              id="titulo"
              placeholder="Breve descripción del problema"
              value={formData.titulo}
              onChange={(e) => handleInputChange("titulo", e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="descripcion">Descripción *</Label>
            <Textarea
              id="descripcion"
              placeholder="Describe detalladamente el problema..."
              rows={4}
              value={formData.descripcion}
              onChange={(e) =>
                handleInputChange("descripcion", e.target.value)
              }
              disabled={loading}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Categoría *</Label>
              <Select
                value={formData.categoria}
                onValueChange={(value) => handleInputChange("categoria", value)}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Prioridad</Label>
              <Select
                value={formData.prioridad}
                onValueChange={(value) =>
                  handleInputChange("prioridad", value)
                }
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Área</Label>
              <Select
                value={formData.area}
                onValueChange={(value) => handleInputChange("area", value)}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar" />
                </SelectTrigger>
                <SelectContent>
                  {AREAS.map((area) => (
                    <SelectItem key={area} value={area}>
                      {area}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Dispositivo</Label>
              <Select
                value={formData.dispositivo}
                onValueChange={(value) =>
                  handleInputChange("dispositivo", value)
                }
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar" />
                </SelectTrigger>
                <SelectContent>
                  {DEVICES.map((device) => (
                    <SelectItem key={device} value={device}>
                      {device}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Archivos Adjuntos</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {attachments.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center gap-1 bg-muted px-2 py-1 rounded-md text-sm"
                >
                  <FileText className="w-4 h-4" />
                  <span className="max-w-[100px] truncate">{file.name}</span>
                  <button
                    type="button"
                    onClick={() => removeAttachment(index)}
                    className="text-muted-foreground hover:text-foreground"
                    disabled={loading}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
              onChange={handleFileSelect}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={loading}
              className="w-full"
            >
              <Upload className="w-4 h-4 mr-2" />
              Adjuntar archivos
            </Button>
            <p className="text-xs text-muted-foreground">
              Imágenes, PDFs, Word, Excel (máx. 10MB cada uno)
            </p>
          </div>

          {error && (
            <p className="text-sm text-red-500 bg-red-50 p-2 rounded">{error}</p>
          )}

          <DialogFooter className="border-t pt-5 mt-6 sm:justify-between gap-3 flex-col sm:flex-row">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading || uploadingFiles}
              className="rounded-full px-6 w-full sm:w-auto"
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || uploadingFiles} className="rounded-full px-8 shadow-md hover:shadow-lg w-full sm:w-auto">
              {loading || uploadingFiles ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {uploadingFiles ? "Subiendo adjuntos..." : "Procesando..."}
                </>
              ) : (
                <>
                  <PlusCircle className="w-5 h-5 mr-2" />
                  Enviar Ticket
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}