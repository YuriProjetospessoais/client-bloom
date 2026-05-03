import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Search, Plus, MoreHorizontal, Edit, Trash2, Package, ShoppingCart, AlertTriangle,
} from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ProductModal } from '@/components/modals/ProductModal';
import { ProductSaleModal } from '@/components/modals/ProductSaleModal';
import { ConfirmDialog } from '@/components/modals/ConfirmDialog';
import { useProducts, type Product } from '@/hooks/queries/useProducts';
import { useDeleteProduct } from '@/hooks/mutations/useProductMutations';

type StatusFilter = 'all' | 'active' | 'inactive';

export default function ProductsPage() {
  const { data: products = [], isLoading } = useProducts({ onlyActive: false });
  const deleteProduct = useDeleteProduct();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [saleModalOpen, setSaleModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  const filtered = useMemo(() => {
    const term = search.toLowerCase();
    return products.filter((p) => {
      if (statusFilter === 'active' && !p.active) return false;
      if (statusFilter === 'inactive' && p.active) return false;
      if (term && !p.name.toLowerCase().includes(term)) return false;
      return true;
    });
  }, [products, search, statusFilter]);

  const lowStock = useMemo(
    () => products.filter((p) => p.active && p.stock <= 5),
    [products],
  );

  const openNew = () => { setSelectedProduct(null); setProductModalOpen(true); };
  const openEdit = (p: Product) => { setSelectedProduct(p); setProductModalOpen(true); };

  const confirmDelete = async () => {
    if (!productToDelete) return;
    await deleteProduct.mutateAsync(productToDelete.id);
    setProductToDelete(null);
  };

  return (
    <motion.div className="space-y-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Produtos</h1>
          <p className="text-muted-foreground mt-1">Gestão de catálogo, estoque e vendas</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={() => setSaleModalOpen(true)}>
            <ShoppingCart className="w-4 h-4" /> Registrar Venda
          </Button>
          <Button className="gradient-primary text-white gap-2" onClick={openNew}>
            <Plus className="w-4 h-4" /> Novo Produto
          </Button>
        </div>
      </div>

      {lowStock.length > 0 && (
        <Card className="border-destructive/40 bg-destructive/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              Estoque baixo ({lowStock.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {lowStock.map((p) => (
                <Badge key={p.id} variant="destructive">
                  {p.name} — {p.stock} un
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="glass-card">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" /> Catálogo
            </CardTitle>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 w-full sm:w-64"
                />
              </div>
              <Select value={statusFilter} onValueChange={(v: StatusFilter) => setStatusFilter(v)}>
                <SelectTrigger className="w-full sm:w-40"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="active">Ativos</SelectItem>
                  <SelectItem value="inactive">Inativos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produto</TableHead>
                  <TableHead>Preço</TableHead>
                  <TableHead>Estoque</TableHead>
                  <TableHead>Duração</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[60px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell>R$ {Number(p.price).toFixed(2)}</TableCell>
                    <TableCell>
                      {p.stock <= 5 ? (
                        <Badge variant="destructive">{p.stock} un</Badge>
                      ) : (
                        <span>{p.stock} un</span>
                      )}
                    </TableCell>
                    <TableCell>{p.duration_days} dias</TableCell>
                    <TableCell>
                      <Badge className={p.active ? 'bg-success/20 text-success' : 'bg-muted text-muted-foreground'}>
                        {p.active ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon"><MoreHorizontal className="w-4 h-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEdit(p)}>
                            <Edit className="w-4 h-4 mr-2" /> Editar
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive" onClick={() => setProductToDelete(p)}>
                            <Trash2 className="w-4 h-4 mr-2" /> Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      Nenhum produto encontrado
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <ProductModal open={productModalOpen} onOpenChange={setProductModalOpen} product={selectedProduct} />
      <ProductSaleModal open={saleModalOpen} onOpenChange={setSaleModalOpen} />
      <ConfirmDialog
        open={!!productToDelete}
        onOpenChange={(o) => !o && setProductToDelete(null)}
        title="Excluir Produto"
        description={`Tem certeza que deseja excluir "${productToDelete?.name}"?`}
        onConfirm={confirmDelete}
      />
    </motion.div>
  );
}
