import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { VehicleForm } from "@/components/vehicles/VehicleForm";

export const metadata = { title: "Add Vehicle" };

export default function NewVehiclePage() {
  return (
    <div className="mx-auto max-w-lg px-4 py-10 sm:px-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Add a vehicle</CardTitle>
          <CardDescription>
            You can add more details and control what&apos;s visible to visitors later.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <VehicleForm mode="create" />
        </CardContent>
      </Card>
    </div>
  );
}
