 import { useState, useEffect } from 'react';
 import { motion } from 'framer-motion';
 import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
 import { Button } from '@/components/ui/button';
 import { Input } from '@/components/ui/input';
 import { Badge } from '@/components/ui/badge';
 import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
 import { Search, Package, ShoppingCart, AlertCircle } from 'lucide-react';
 import { ProductSaleModal } from '@/components/modals/ProductSaleModal';
 import { productsStore, productSalesStore, Product, ProductSale } from '@/lib/store';
 
 export default function UserProductsPage() {
   const [searchTerm, setSearchTerm] = useState('');
   const [products, setProducts] = useState<Product[]>([]);
   const [productsNearEnd, setProductsNearEnd] = useState<ProductSale[]>([]);
   const [saleModalOpen, setSaleModalOpen] = useState(false);
 
   useEffect(() => {
     setProducts(productsStore.getAll());
     setProductsNearEnd(productSalesStore.getProductsNearEnd(7));
   }, []);
 
   const filteredProducts = products.filter(p =>
     p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
     p.category.toLowerCase().includes(searchTerm.toLowerCase())
   );
 
   const handleSaveSale = (sale: Omit<ProductSale, 'id'>) => {
     productSalesStore.create(sale);
     setProductsNearEnd(productSalesStore.getProductsNearEnd(7));
   };
 
   const topProducts = productSalesStore.getTopProducts(5);
 
   return (
     <motion.div className="space-y-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
       <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
         <div>
           <h1 className="text-3xl font-bold text-foreground">Produtos</h1>
           <p className="text-muted-foreground mt-1">Catálogo de produtos e vendas</p>
         </div>
         <Button variant="outline" className="gap-2" onClick={() => setSaleModalOpen(true)}>
           <ShoppingCart className="w-4 h-4" />
           Registrar Venda
         </Button>
       </div>
 
       {/* Alerts for products near end */}
       {productsNearEnd.length > 0 && (
         <Card className="border-warning/50 bg-warning/5">
           <CardHeader className="pb-3">
             <CardTitle className="text-base flex items-center gap-2">
               <AlertCircle className="w-5 h-5 text-warning" />
               Oportunidades de Recompra ({productsNearEnd.length})
             </CardTitle>
           </CardHeader>
           <CardContent>
             <div className="grid gap-2">
               {productsNearEnd.slice(0, 3).map((sale) => {
                 const daysLeft = Math.ceil((new Date(sale.estimatedEndDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                 return (
                   <div key={sale.id} className="flex items-center justify-between p-3 rounded-lg bg-background">
                     <div>
                       <p className="font-medium">{sale.clientName}</p>
                       <p className="text-sm text-muted-foreground">{sale.productName} - termina em {daysLeft} dias</p>
                     </div>
                     <Badge variant={daysLeft <= 3 ? 'destructive' : 'secondary'}>
                       {daysLeft} dias
                     </Badge>
                   </div>
                 );
               })}
             </div>
           </CardContent>
         </Card>
       )}
 
       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         {/* Products Table */}
         <Card className="lg:col-span-2 glass-card">
           <CardHeader>
             <div className="flex items-center justify-between">
               <CardTitle className="flex items-center gap-2">
                 <Package className="w-5 h-5" />
                 Catálogo de Produtos
               </CardTitle>
               <div className="relative max-w-xs">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                 <Input placeholder="Buscar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
               </div>
             </div>
           </CardHeader>
           <CardContent>
             <Table>
               <TableHeader>
                 <TableRow>
                   <TableHead>Produto</TableHead>
                   <TableHead>Categoria</TableHead>
                   <TableHead>Preço</TableHead>
                   <TableHead>Duração</TableHead>
                   <TableHead>Status</TableHead>
                 </TableRow>
               </TableHeader>
               <TableBody>
                 {filteredProducts.map((product) => (
                   <TableRow key={product.id}>
                     <TableCell className="font-medium">{product.name}</TableCell>
                     <TableCell><Badge variant="outline">{product.category}</Badge></TableCell>
                     <TableCell>R$ {product.price.toFixed(2)}</TableCell>
                     <TableCell>{product.durationDays} dias</TableCell>
                     <TableCell>
                       <Badge className={product.active ? 'bg-success/20 text-success' : 'bg-muted text-muted-foreground'}>
                         {product.active ? 'Ativo' : 'Inativo'}
                       </Badge>
                     </TableCell>
                   </TableRow>
                 ))}
               </TableBody>
             </Table>
           </CardContent>
         </Card>
 
         {/* Top Products */}
         <Card className="glass-card">
           <CardHeader>
             <CardTitle className="text-base">Produtos Mais Vendidos</CardTitle>
           </CardHeader>
           <CardContent className="space-y-3">
             {topProducts.map((product, index) => (
               <div key={product.name} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                 <div className="flex items-center gap-3">
                   <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold">{index + 1}</span>
                   <span className="font-medium text-sm">{product.name}</span>
                 </div>
                 <div className="text-right">
                   <p className="font-semibold">{product.count}x</p>
                   <p className="text-xs text-muted-foreground">R$ {product.revenue.toFixed(0)}</p>
                 </div>
               </div>
             ))}
             {topProducts.length === 0 && <p className="text-center text-muted-foreground py-4">Nenhuma venda registrada</p>}
           </CardContent>
         </Card>
       </div>
 
       <ProductSaleModal open={saleModalOpen} onOpenChange={setSaleModalOpen} onSave={handleSaveSale} />
     </motion.div>
   );
 }