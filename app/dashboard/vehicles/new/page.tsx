import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { VehicleForm } from "@/components/vehicles/VehicleForm";
import { PageHeader } from "@/components/shared/PageHeader";

export const metadata = { title: "Add Vehicle" };

export default function NewVehiclePage() {
  return (
    <div className="mx-auto max-w-xl">
      <PageHeader
        title="Add a vehicle"
        description="You can add more details and control what's visible to visitors later."
      />

      <Card className="mt-6 rounded-xl">
        <CardHeader>
          <CardTitle className="text-base">Vehicle details</CardTitle>
          <CardDescription>A nickname is all it takes to start.</CardDescription>
        </CardHeader>
        <CardContent>
          <VehicleForm mode="create" />
        </CardContent>
      </Card>
    </div>
  );
}
