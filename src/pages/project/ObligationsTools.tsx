import { useState } from "react";
import { useParams } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useObligations, type Obligation } from "@/hooks/useObligations";
import { useDocumentRepository } from "@/hooks/useDocumentRepository";
import { useObligationDocuments } from "@/hooks/useObligationDocuments";
import { Download, Upload, Trash2, Pencil, Plus, ExternalLink, Link as LinkIcon, X, BookOpen } from "lucide-react";
import { toast } from "sonner";

export default function ObligationsTools() {
  const { projectId } = useParams();
  const { obligations, isLoading, createObligation, updateObligation, deleteObligation } = useObligations(projectId!);
  const { documents, isLoading: docsLoading, createDocument, updateDocument, deleteDocument } = useDocumentRepository();
  const [selectedObligationId, setSelectedObligationId] = useState<string | null>(null);
  const { linkedDocuments, linkDocument, unlinkDocument } = useObligationDocuments(selectedObligationId);

  // Builder state
  const [selectedDocumentId, setSelectedDocumentId] = useState<string>("");
  const [builderForm, setBuilderForm] = useState({
    relevance_description: "",
  });

  // Editor state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingObligation, setEditingObligation] = useState<Obligation | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    obligation_type: "",
    compliance_framework: "",
    status: "",
    due_date: "",
    owner: "",
  });

  // Document repository state
  const [addDocDialogOpen, setAddDocDialogOpen] = useState(false);
  const [editDocDialogOpen, setEditDocDialogOpen] = useState(false);
  const [linkDocDialogOpen, setLinkDocDialogOpen] = useState(false);
  const [editingDocument, setEditingDocument] = useState<any>(null);
  const [newDocForm, setNewDocForm] = useState({
    name: "",
    document_type: "standard",
    category: "",
    description: "",
    url: "",
  });
  const [editDocForm, setEditDocForm] = useState({
    name: "",
    document_type: "",
    category: "",
    description: "",
    url: "",
  });
  const [docFilter, setDocFilter] = useState<string>("all");

  const handleBuilderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const selectedDoc = documents.find(d => d.id === selectedDocumentId);
    if (!selectedDoc) {
      toast.error("Please select a document");
      return;
    }

    // Create obligation based on selected document and link it
    createObligation({
      project_id: projectId!,
      name: selectedDoc.name,
      description: builderForm.relevance_description,
      obligation_type: selectedDoc.document_type,
      compliance_framework: selectedDoc.category || "",
      document_id: selectedDocumentId, // Pass document ID for automatic linking
    } as any);
    
    setSelectedDocumentId("");
    setBuilderForm({
      relevance_description: "",
    });
  };

  const handleEditClick = (obligation: Obligation) => {
    setEditingObligation(obligation);
    setSelectedObligationId(obligation.id);
    setEditForm({
      name: obligation.name,
      description: obligation.description || "",
      obligation_type: obligation.obligation_type || "",
      compliance_framework: obligation.compliance_framework || "",
      status: obligation.status || "",
      due_date: obligation.due_date || "",
      owner: obligation.owner || "",
    });
    setEditDialogOpen(true);
  };

  const handleEditSubmit = async () => {
    if (!editingObligation) return;
    updateObligation({
      id: editingObligation.id,
      ...editForm,
    });
    setEditDialogOpen(false);
    setEditingObligation(null);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this obligation?")) {
      deleteObligation(id);
    }
  };

  const handleExportCSV = () => {
    const headers = ["name", "description", "obligation_type", "compliance_framework", "status", "due_date", "owner"];
    const csvContent = [
      headers.join(","),
      ...obligations.map(obligation =>
        headers.map(header => {
          const value = obligation[header as keyof Obligation] || "";
          return `"${String(value).replace(/"/g, '""')}"`;
        }).join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `obligations-${projectId}-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    toast.success("CSV exported successfully");
  };

  const handleDownloadExample = () => {
    const exampleCSV = [
      "name,description,obligation_type,compliance_framework,status,due_date,owner",
      '"GDPR Data Protection","Ensure compliance with GDPR requirements","Legal","GDPR","In Progress","2024-12-31","John Doe"',
      '"ISO 27001 Certification","Maintain ISO 27001 compliance","Regulatory","ISO 27001","Active","2025-06-30","Jane Smith"',
    ].join("\n");

    const blob = new Blob([exampleCSV], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "obligations-example.csv";
    a.click();
    toast.success("Example CSV downloaded");
  };

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const csvText = event.target?.result as string;
      const lines = csvText.split("\n").filter(line => line.trim());
      
      if (lines.length < 2) {
        toast.error("CSV file is empty or invalid");
        return;
      }

      const headers = lines[0].split(",").map(h => h.trim().replace(/"/g, ""));
      const dataLines = lines.slice(1);

      let importedCount = 0;
      for (const line of dataLines) {
        const values = line.split(",").map(v => v.trim().replace(/^"|"$/g, ""));
        const obligation: any = { project_id: projectId };

        headers.forEach((header, index) => {
          if (values[index]) {
            obligation[header] = values[index];
          }
        });

        try {
          await createObligation(obligation);
          importedCount++;
        } catch (error) {
          console.error("Error importing obligation:", error);
        }
      }

      toast.success(`Imported ${importedCount} obligations`);
    };

    reader.readAsText(file);
    e.target.value = "";
  };

  const handleAddDocument = (e: React.FormEvent) => {
    e.preventDefault();
    createDocument(newDocForm);
    setNewDocForm({
      name: "",
      document_type: "standard",
      category: "",
      description: "",
      url: "",
    });
    setAddDocDialogOpen(false);
  };

  const handleEditDocument = (doc: any) => {
    setEditingDocument(doc);
    setEditDocForm({
      name: doc.name,
      document_type: doc.document_type,
      category: doc.category || "",
      description: doc.description || "",
      url: doc.url || "",
    });
    setEditDocDialogOpen(true);
  };

  const handleUpdateDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDocument) return;
    
    updateDocument({
      id: editingDocument.id,
      ...editDocForm,
    });
    
    setEditDocDialogOpen(false);
    setEditingDocument(null);
  };

  const handleLinkDocument = (documentId: string) => {
    if (!selectedObligationId) return;
    linkDocument({ obligationId: selectedObligationId, documentId });
  };

  const filteredDocuments = documents.filter(doc => 
    docFilter === "all" || doc.document_type === docFilter
  );

  const categories = Array.from(new Set(documents.map(d => d.category).filter(Boolean))) as string[];
  const documentTypes = Array.from(new Set(documents.map(d => d.document_type)));

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      law: "bg-red-500/10 text-red-500 border-red-500/20",
      standard: "bg-blue-500/10 text-blue-500 border-blue-500/20",
      policy: "bg-green-500/10 text-green-500 border-green-500/20",
      framework: "bg-purple-500/10 text-purple-500 border-purple-500/20",
      guidance: "bg-orange-500/10 text-orange-500 border-orange-500/20",
    };
    return colors[type] || "bg-gray-500/10 text-gray-500 border-gray-500/20";
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Obligations Tools</h1>
        <p className="text-muted-foreground">Manage security and compliance obligations</p>
      </div>

      <Tabs defaultValue="repository" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="repository">Document Repository</TabsTrigger>
          <TabsTrigger value="builder">Obligations Builder</TabsTrigger>
          <TabsTrigger value="bulk">Bulk Import/Export</TabsTrigger>
        </TabsList>

        <TabsContent value="repository">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Document Repository</CardTitle>
                  <CardDescription>
                    Central repository of policies, standards, laws, and frameworks
                  </CardDescription>
                </div>
                <Button onClick={() => setAddDocDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Document
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Select value={docFilter} onValueChange={setDocFilter}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {documentTypes.map(type => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {docsLoading ? (
                <div>Loading documents...</div>
              ) : (
                <div className="space-y-2">
                  {categories.map(category => {
                    const categoryDocs = filteredDocuments.filter(d => d.category === category);
                    if (categoryDocs.length === 0) return null;
                    
                    return (
                      <div key={category} className="space-y-2">
                        <h3 className="text-sm font-semibold text-muted-foreground">{category}</h3>
                        <div className="space-y-1">
                          {categoryDocs.map(doc => (
                            <div
                              key={doc.id}
                              className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                            >
                              <div className="flex-1 space-y-1">
                                <div className="flex items-center gap-2">
                                  <h4 className="font-medium">{doc.name}</h4>
                                  <Badge variant="outline" className={getTypeColor(doc.document_type)}>
                                    {doc.document_type}
                                  </Badge>
                                </div>
                                {doc.description && (
                                  <p className="text-sm text-muted-foreground">{doc.description}</p>
                                )}
                              </div>
                              <div className="flex gap-2">
                                {doc.url && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => window.open(doc.url, '_blank')}
                                  >
                                    <ExternalLink className="h-4 w-4" />
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEditDocument(doc)}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="builder" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Create New Obligation</CardTitle>
              <CardDescription>Select a document from the repository and explain its relevance to your project</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleBuilderSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="document-select">Select Document *</Label>
                  <Select value={selectedDocumentId} onValueChange={setSelectedDocumentId} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a policy, standard, law, or framework" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                      {categories.map(category => {
                        const categoryDocs = documents.filter(d => d.category === category);
                        return (
                          <div key={category}>
                            <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">
                              {category}
                            </div>
                            {categoryDocs.map(doc => (
                              <SelectItem key={doc.id} value={doc.id}>
                                <div className="flex items-center gap-2">
                                  <span>{doc.name}</span>
                                  <Badge variant="outline" className={getTypeColor(doc.document_type)}>
                                    {doc.document_type}
                                  </Badge>
                                </div>
                              </SelectItem>
                            ))}
                          </div>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  {selectedDocumentId && (
                    <div className="mt-2 p-3 rounded-lg border bg-accent/50">
                      {(() => {
                        const doc = documents.find(d => d.id === selectedDocumentId);
                        return doc ? (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className={getTypeColor(doc.document_type)}>
                                {doc.document_type}
                              </Badge>
                              <span className="text-sm text-muted-foreground">{doc.category}</span>
                            </div>
                            {doc.description && (
                              <p className="text-sm">{doc.description}</p>
                            )}
                            {doc.url && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => window.open(doc.url, '_blank')}
                              >
                                <ExternalLink className="mr-2 h-3 w-3" />
                                View Document
                              </Button>
                            )}
                          </div>
                        ) : null;
                      })()}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="relevance">Relevance to Project *</Label>
                  <Textarea
                    id="relevance"
                    value={builderForm.relevance_description}
                    onChange={(e) => setBuilderForm({ ...builderForm, relevance_description: e.target.value })}
                    placeholder="Explain why this document is relevant to your project and what obligations it creates..."
                    rows={4}
                    required
                  />
                </div>

                <Button type="submit" className="w-full" disabled={!selectedDocumentId}>
                  Create Obligation
                </Button>
              </form>
            </CardContent>
          </Card>

          {obligations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Existing Obligations</CardTitle>
                <CardDescription>View and edit your project obligations</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div>Loading...</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Framework</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead>Owner</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {obligations.map((obligation) => (
                        <TableRow key={obligation.id}>
                          <TableCell className="font-medium">
                            {obligation.name}
                          </TableCell>
                          <TableCell>{obligation.obligation_type || "-"}</TableCell>
                          <TableCell>{obligation.compliance_framework || "-"}</TableCell>
                          <TableCell>{obligation.status || "-"}</TableCell>
                          <TableCell>{obligation.due_date || "-"}</TableCell>
                          <TableCell>{obligation.owner || "-"}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedObligationId(obligation.id);
                                  setLinkDocDialogOpen(true);
                                }}
                              >
                                <LinkIcon className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditClick(obligation)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleDelete(obligation.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>


        <TabsContent value="bulk">
          <Card>
            <CardHeader>
              <CardTitle>Bulk Import/Export</CardTitle>
              <CardDescription>Import or export obligations using CSV files</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col gap-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Export</h3>
                  <Button onClick={handleExportCSV} className="w-full">
                    <Download className="mr-2 h-4 w-4" />
                    Export to CSV
                  </Button>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2">Import</h3>
                  <Input
                    id="obligation-csv-upload"
                    type="file"
                    accept=".csv"
                    onChange={handleImportCSV}
                    className="hidden"
                  />
                  <Button
                    onClick={() => document.getElementById("obligation-csv-upload")?.click()}
                    className="w-full"
                    variant="outline"
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Import from CSV
                  </Button>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2">Example CSV</h3>
                  <Button onClick={handleDownloadExample} variant="secondary" className="w-full">
                    <Download className="mr-2 h-4 w-4" />
                    Download Example CSV
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Obligation</DialogTitle>
            <DialogDescription>
              Update the obligation details
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Obligation Name *</Label>
              <Input
                id="edit-name"
                value={editForm.name}
                onChange={(e) =>
                  setEditForm({ ...editForm, name: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={editForm.description}
                onChange={(e) =>
                  setEditForm({ ...editForm, description: e.target.value })
                }
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-type">Type</Label>
                <Input
                  id="edit-type"
                  value={editForm.obligation_type}
                  onChange={(e) =>
                    setEditForm({ ...editForm, obligation_type: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-framework">Compliance Framework</Label>
                <Input
                  id="edit-framework"
                  value={editForm.compliance_framework}
                  onChange={(e) =>
                    setEditForm({ ...editForm, compliance_framework: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-status">Status</Label>
                <Input
                  id="edit-status"
                  value={editForm.status}
                  onChange={(e) =>
                    setEditForm({ ...editForm, status: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-due-date">Due Date</Label>
                <Input
                  id="edit-due-date"
                  type="date"
                  value={editForm.due_date}
                  onChange={(e) =>
                    setEditForm({ ...editForm, due_date: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-owner">Owner</Label>
              <Input
                id="edit-owner"
                value={editForm.owner}
                onChange={(e) =>
                  setEditForm({ ...editForm, owner: e.target.value })
                }
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Linked Documents</Label>
            {linkedDocuments.length === 0 ? (
              <p className="text-sm text-muted-foreground">No documents linked yet</p>
            ) : (
              <div className="space-y-2">
                {linkedDocuments.map((link) => (
                  <div key={link.id} className="flex items-center justify-between p-2 border rounded">
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4" />
                      <span className="text-sm">{link.document?.name}</span>
                      <Badge variant="outline" className={getTypeColor(link.document?.document_type || "")}>
                        {link.document?.document_type}
                      </Badge>
                      {link.document?.url && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(link.document?.url, '_blank')}
                        >
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => unlinkDocument(link.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditSubmit}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={addDocDialogOpen} onOpenChange={setAddDocDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Document to Repository</DialogTitle>
            <DialogDescription>
              Add a new policy, standard, law, or framework that will be available for all projects
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddDocument} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="doc-name">Document Name *</Label>
              <Input
                id="doc-name"
                value={newDocForm.name}
                onChange={(e) => setNewDocForm({ ...newDocForm, name: e.target.value })}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="doc-type">Type *</Label>
                <Select
                  value={newDocForm.document_type}
                  onValueChange={(value) => setNewDocForm({ ...newDocForm, document_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="law">Law</SelectItem>
                    <SelectItem value="standard">Standard</SelectItem>
                    <SelectItem value="policy">Policy</SelectItem>
                    <SelectItem value="framework">Framework</SelectItem>
                    <SelectItem value="guidance">Guidance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="doc-category">Category</Label>
                <Input
                  id="doc-category"
                  value={newDocForm.category}
                  onChange={(e) => setNewDocForm({ ...newDocForm, category: e.target.value })}
                  placeholder="e.g., UK Law, International"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="doc-description">Description</Label>
              <Textarea
                id="doc-description"
                value={newDocForm.description}
                onChange={(e) => setNewDocForm({ ...newDocForm, description: e.target.value })}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="doc-url">URL</Label>
              <Input
                id="doc-url"
                type="url"
                value={newDocForm.url}
                onChange={(e) => setNewDocForm({ ...newDocForm, url: e.target.value })}
                placeholder="https://..."
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAddDocDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Add Document</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={editDocDialogOpen} onOpenChange={setEditDocDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Document</DialogTitle>
            <DialogDescription>
              Update the document information
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateDocument} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-doc-name">Document Name *</Label>
              <Input
                id="edit-doc-name"
                value={editDocForm.name}
                onChange={(e) => setEditDocForm({ ...editDocForm, name: e.target.value })}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-doc-type">Type *</Label>
                <Select
                  value={editDocForm.document_type}
                  onValueChange={(value) => setEditDocForm({ ...editDocForm, document_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="law">Law</SelectItem>
                    <SelectItem value="standard">Standard</SelectItem>
                    <SelectItem value="policy">Policy</SelectItem>
                    <SelectItem value="framework">Framework</SelectItem>
                    <SelectItem value="guidance">Guidance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-doc-category">Category</Label>
                <Input
                  id="edit-doc-category"
                  value={editDocForm.category}
                  onChange={(e) => setEditDocForm({ ...editDocForm, category: e.target.value })}
                  placeholder="e.g., UK Law, International"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-doc-description">Description</Label>
              <Textarea
                id="edit-doc-description"
                value={editDocForm.description}
                onChange={(e) => setEditDocForm({ ...editDocForm, description: e.target.value })}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-doc-url">URL</Label>
              <Input
                id="edit-doc-url"
                type="url"
                value={editDocForm.url}
                onChange={(e) => setEditDocForm({ ...editDocForm, url: e.target.value })}
                placeholder="https://..."
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditDocDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Update Document</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={linkDocDialogOpen} onOpenChange={setLinkDocDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Link Documents to Obligation</DialogTitle>
            <DialogDescription>
              Select documents from the repository to link to this obligation
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 overflow-y-auto max-h-[60vh]">
            <Select value={docFilter} onValueChange={setDocFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {documentTypes.map(type => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="space-y-2">
              {filteredDocuments.map(doc => {
                const isLinked = linkedDocuments.some(ld => ld.document_id === doc.id);
                return (
                  <div
                    key={doc.id}
                    className="flex items-start gap-3 p-3 rounded-lg border bg-card"
                  >
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-sm">{doc.name}</h4>
                        <Badge variant="outline" className={getTypeColor(doc.document_type)}>
                          {doc.document_type}
                        </Badge>
                      </div>
                      {doc.category && (
                        <p className="text-xs text-muted-foreground">{doc.category}</p>
                      )}
                      {doc.description && (
                        <p className="text-xs text-muted-foreground">{doc.description}</p>
                      )}
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleLinkDocument(doc.id)}
                      disabled={isLinked}
                    >
                      {isLinked ? "Linked" : "Link"}
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setLinkDocDialogOpen(false)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
