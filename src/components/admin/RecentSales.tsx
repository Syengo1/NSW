import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"; // If you don't have shadcn, just use a div
import { formatCurrency } from "@/lib/utils";

export function RecentSales({ orders }: { orders: any[] }) {
  return (
    <div className="space-y-8">
      {orders.map((order) => (
        <div key={order.id} className="flex items-center">
          {/* Avatar Placeholder */}
          <div className="h-9 w-9 rounded-full bg-slate-200 flex items-center justify-center mr-4">
             <span className="font-bold text-xs text-slate-600">
                {order.profiles?.first_name?.[0] || "U"}
             </span>
          </div>
          
          <div className="ml-4 space-y-1">
            <p className="text-sm font-medium leading-none">
              {order.profiles?.first_name} {order.profiles?.last_name}
            </p>
            <p className="text-sm text-muted-foreground">
              {order.profiles?.email || "customer@example.com"}
            </p>
          </div>
          <div className="ml-auto font-medium">
            +{formatCurrency(order.total)}
          </div>
        </div>
      ))}
    </div>
  );
}