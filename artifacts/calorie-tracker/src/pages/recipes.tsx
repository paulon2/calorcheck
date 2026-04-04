import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListRecipes,
  useCreateRecipe,
  useDeleteRecipe,
  useToggleRecipeFavorite,
  getListRecipesQueryKey,
} from "@workspace/api-client-react";
import { ObjectUploader } from "@workspace/object-storage-web";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Plus, Heart, Trash2, ChevronDown, ChevronUp, Image } from "lucide-react";

const schema = z.object({
  title: z.string().min(1, "Titulo obrigatorio"),
  description: z.string().optional(),
  ingredients: z.string().min(1, "Ingredientes obrigatorios"),
  instructions: z.string().min(1, "Modo de preparo obrigatorio"),
  calories: z.coerce.number().optional(),
});
type FormData = z.infer<typeof schema>;

function RecipeCard({
  recipe,
  onDelete,
  onToggleFavorite,
}: {
  recipe: {
    id: number;
    title: string;
    description: string;
    ingredients: string;
    instructions: string;
    calories: number | null;
    photoPath: string | null;
    isFavorite: boolean;
    createdAt: string;
  };
  onDelete: (id: number) => void;
  onToggleFavorite: (id: number, current: boolean) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  const photoUrl = recipe.photoPath
    ? `/api/storage${recipe.photoPath}`
    : null;

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm transition-shadow hover:shadow-md">
      {photoUrl && (
        <img
          src={photoUrl}
          alt={recipe.title}
          className="w-full h-40 object-cover"
        />
      )}
      {!photoUrl && (
        <div className="w-full h-28 bg-gradient-to-br from-primary/10 to-accent/20 flex items-center justify-center">
          <Image size={32} className="text-muted-foreground/40" />
        </div>
      )}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-base leading-tight">{recipe.title}</h3>
            {recipe.calories && (
              <span className="text-xs text-primary font-semibold">{recipe.calories} kcal por porção</span>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => onToggleFavorite(recipe.id, recipe.isFavorite)}
              className={`p-1.5 rounded-full transition-colors ${
                recipe.isFavorite
                  ? "text-red-500 bg-red-50"
                  : "text-muted-foreground hover:text-red-400 hover:bg-red-50"
              }`}
            >
              <Heart size={16} fill={recipe.isFavorite ? "currentColor" : "none"} />
            </button>
            <button
              onClick={() => onDelete(recipe.id)}
              className="p-1.5 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
            >
              <Trash2 size={15} />
            </button>
          </div>
        </div>

        {recipe.description && (
          <p className="text-sm text-muted-foreground mt-1 leading-snug">{recipe.description}</p>
        )}

        <button
          onClick={() => setExpanded((v) => !v)}
          className="flex items-center gap-1 text-xs font-medium text-primary mt-3 hover:underline"
        >
          {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          {expanded ? "Ocultar detalhes" : "Ver receita completa"}
        </button>

        {expanded && (
          <div className="mt-3 space-y-3 border-t border-border pt-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                Ingredientes
              </p>
              <p className="text-sm whitespace-pre-wrap leading-relaxed">{recipe.ingredients}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                Modo de preparo
              </p>
              <p className="text-sm whitespace-pre-wrap leading-relaxed">{recipe.instructions}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function AddRecipeDialog() {
  const [open, setOpen] = useState(false);
  const [photoPath, setPhotoPath] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const createRecipe = useCreateRecipe();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = (data: FormData) => {
    createRecipe.mutate(
      {
        data: {
          title: data.title,
          description: data.description ?? "",
          ingredients: data.ingredients,
          instructions: data.instructions,
          calories: data.calories ?? null,
          photoPath: photoPath ?? null,
        },
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListRecipesQueryKey() });
          toast({ title: "Receita adicionada!" });
          reset();
          setPhotoPath(null);
          setOpen(false);
        },
        onError: () => {
          toast({ title: "Erro ao salvar receita", variant: "destructive" });
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg" className="rounded-full shadow-lg gap-2">
          <Plus size={20} />
          Nova receita
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm mx-auto rounded-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Adicionar receita</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
          <div className="space-y-1">
            <Label>Foto da receita (opcional)</Label>
            {photoPath ? (
              <div className="flex items-center gap-2">
                <img
                  src={`/api/storage${photoPath}`}
                  alt="Foto"
                  className="w-16 h-16 rounded-lg object-cover border border-border"
                />
                <button
                  type="button"
                  onClick={() => setPhotoPath(null)}
                  className="text-xs text-destructive hover:underline"
                >
                  Remover foto
                </button>
              </div>
            ) : (
              <ObjectUploader
                onGetUploadParameters={async (file) => {
                  const res = await fetch("/api/storage/uploads/request-url", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      name: file.name,
                      size: file.size,
                      contentType: file.type,
                    }),
                  });
                  const { uploadURL } = await res.json();
                  return { method: "PUT", url: uploadURL, headers: { "Content-Type": file.type } };
                }}
                onComplete={(result) => {
                  if (result.successful?.[0]) {
                    const response = result.successful[0].response?.body as { objectPath?: string };
                    if (response?.objectPath) {
                      setPhotoPath(response.objectPath);
                      toast({ title: "Foto enviada!" });
                    }
                  }
                }}
              >
                Enviar foto
              </ObjectUploader>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="title">Nome da receita</Label>
            <Input id="title" placeholder="Ex: Salada de frango grelhado" {...register("title")} />
            {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
          </div>

          <div className="space-y-1">
            <Label htmlFor="description">Descricao breve (opcional)</Label>
            <Input id="description" placeholder="Uma receita leve e deliciosa..." {...register("description")} />
          </div>

          <div className="space-y-1">
            <Label htmlFor="calories">Calorias por porcao (opcional)</Label>
            <Input id="calories" type="number" placeholder="350" {...register("calories")} />
          </div>

          <div className="space-y-1">
            <Label htmlFor="ingredients">Ingredientes</Label>
            <Textarea
              id="ingredients"
              placeholder="- 200g de peito de frango&#10;- 1 colher de azeite&#10;- Sal e pimenta a gosto"
              className="min-h-[90px] text-sm"
              {...register("ingredients")}
            />
            {errors.ingredients && <p className="text-xs text-destructive">{errors.ingredients.message}</p>}
          </div>

          <div className="space-y-1">
            <Label htmlFor="instructions">Modo de preparo</Label>
            <Textarea
              id="instructions"
              placeholder="1. Tempere o frango...&#10;2. Grelhe por 7 minutos de cada lado..."
              className="min-h-[100px] text-sm"
              {...register("instructions")}
            />
            {errors.instructions && <p className="text-xs text-destructive">{errors.instructions.message}</p>}
          </div>

          <Button type="submit" className="w-full" disabled={createRecipe.isPending}>
            {createRecipe.isPending ? "Salvando..." : "Salvar receita"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function Recipes() {
  const [tab, setTab] = useState<"all" | "favorites">("all");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const params = tab === "favorites" ? { favoritesOnly: "true" } : {};
  const { data: recipes, isLoading } = useListRecipes(params, {
    query: { queryKey: getListRecipesQueryKey(params) },
  });

  const deleteRecipe = useDeleteRecipe();
  const toggleFavorite = useToggleRecipeFavorite();

  const handleDelete = (id: number) => {
    deleteRecipe.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListRecipesQueryKey() });
        queryClient.invalidateQueries({ queryKey: getListRecipesQueryKey({ favoritesOnly: "true" }) });
        toast({ title: "Receita removida" });
      },
    });
  };

  const handleToggleFavorite = (id: number, current: boolean) => {
    toggleFavorite.mutate({ id, data: { isFavorite: !current } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListRecipesQueryKey() });
        queryClient.invalidateQueries({ queryKey: getListRecipesQueryKey({ favoritesOnly: "true" }) });
      },
    });
  };

  return (
    <div className="px-4 pt-8 pb-6 flex flex-col min-h-full">
      <h1 className="text-2xl font-bold mb-1">Minhas receitas</h1>
      <p className="text-muted-foreground text-sm mb-4">Salve e compartilhe suas receitas favoritas</p>

      <Tabs value={tab} onValueChange={(v) => setTab(v as "all" | "favorites")} className="mb-4">
        <TabsList className="w-full">
          <TabsTrigger value="all" className="flex-1">Todas</TabsTrigger>
          <TabsTrigger value="favorites" className="flex-1">Favoritas</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="flex-1 space-y-4">
        {isLoading ? (
          [1, 2].map((i) => <Skeleton key={i} className="h-52 rounded-2xl" />)
        ) : recipes && recipes.length > 0 ? (
          recipes.map((recipe) => (
            <RecipeCard
              key={recipe.id}
              recipe={recipe}
              onDelete={handleDelete}
              onToggleFavorite={handleToggleFavorite}
            />
          ))
        ) : (
          <div className="text-center py-14 text-muted-foreground">
            <p className="text-lg font-medium">
              {tab === "favorites" ? "Nenhuma receita favorita ainda" : "Nenhuma receita cadastrada"}
            </p>
            <p className="text-sm mt-1">
              {tab === "favorites"
                ? "Marque receitas com o coracao para vê-las aqui."
                : "Adicione sua primeira receita!"}
            </p>
          </div>
        )}
      </div>

      <div className="flex justify-center pt-6">
        <AddRecipeDialog />
      </div>
    </div>
  );
}
