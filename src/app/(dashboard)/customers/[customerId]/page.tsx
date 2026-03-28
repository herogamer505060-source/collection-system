import { notFound } from "next/navigation";

import { CustomerProfileOverview } from "@/components/customers/customer-profile-overview";
import { getRequiredSessionUser } from "@/lib/auth/get-session-user";
import { hasPermission } from "@/lib/auth/permissions";
import { getCustomerProfile } from "@/server/queries/customers/get-customer-profile";

export const dynamic = "force-dynamic";

type CustomerProfilePageProps = {
  params: Promise<{ customerId: string }>;
};

export default async function CustomerProfilePage({ params }: CustomerProfilePageProps) {
  const sessionUser = await getRequiredSessionUser();
  const { customerId } = await params;
  const profile = await getCustomerProfile({ customerId, sessionUser });
  const canEditCustomer = sessionUser.roles.some(
    (assignment) => assignment.role === "admin" || assignment.role === "manager",
  );
  const canSendWhatsApp = sessionUser.roles.some((assignment) => ["admin", "manager", "collector"].includes(assignment.role));

  if (!profile) {
    notFound();
  }

  return (
    <CustomerProfileOverview
      canEditCustomer={canEditCustomer}
      canManageFollowUps={
        hasPermission(sessionUser, "followUps.manageAny") || hasPermission(sessionUser, "followUps.manageOwn")
      }
      canSendWhatsApp={canSendWhatsApp}
      defaultCollectorUserId={sessionUser.id}
      profile={profile}
    />
  );
}
