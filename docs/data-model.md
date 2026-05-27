# Modelo de Datos Inicial

Este es el esquema conceptual. La siguiente fase debería convertirlo a Prisma/Drizzle.

## Platform

Representa tu SaaS.

- `id`
- `name`
- `ownerUserId`
- `createdAt`

## Workspace

Una app/marca white-label para un entrenador.

- `id`
- `platformId`
- `name`
- `slug`
- `customDomain`
- `supportEmail`
- `logoUrl`
- `accentColor`
- `status`
- `createdAt`

## User

Identidad común para staff y miembros.

- `id`
- `email`
- `passwordHash`
- `fullName`
- `phone`
- `birthDate`
- `timezone`
- `createdAt`

## WorkspaceRole

Permisos dentro de una marca.

- `id`
- `workspaceId`
- `userId`
- `role`

Valores:

- `coach_admin`
- `coach_staff`
- `member`

## MemberProfile

Datos de cliente final.

- `id`
- `workspaceId`
- `userId`
- `coachUserId`
- `status`
- `subscriptionStatus`
- `onboardingStatus`
- `goals`
- `injuries`
- `dietaryPreferences`
- `fitnessPreferences`

## ProgramTemplate

Plantilla reutilizable de entrenamiento.

- `id`
- `workspaceId`
- `name`
- `goal`
- `level`
- `daysPerWeek`
- `status`

## TrainingPlan

Plan asignado a un miembro.

- `id`
- `workspaceId`
- `memberProfileId`
- `programTemplateId`
- `name`
- `startsAt`
- `endsAt`
- `version`
- `status`

## WorkoutDay

- `id`
- `trainingPlanId`
- `weekNumber`
- `dayNumber`
- `title`
- `instructions`

## Exercise

Biblioteca reusable.

- `id`
- `workspaceId`
- `name`
- `muscleGroups`
- `equipment`
- `location`
- `videoUrl`
- `instructions`

## WorkoutExercise

Ejercicio dentro de una rutina.

- `id`
- `workoutDayId`
- `exerciseId`
- `sets`
- `reps`
- `tempo`
- `restSeconds`
- `notes`
- `order`

## MealPlan

- `id`
- `workspaceId`
- `memberProfileId`
- `name`
- `startsAt`
- `endsAt`
- `version`
- `status`

## Recipe

- `id`
- `workspaceId`
- `name`
- `instructions`
- `videoUrl`
- `calories`
- `protein`
- `carbs`
- `fat`

## MealPlanItem

- `id`
- `mealPlanId`
- `dayNumber`
- `mealSlot`
- `recipeId`
- `servings`

## ProgressEntry

- `id`
- `memberProfileId`
- `date`
- `weight`
- `bodyFat`
- `shoulders`
- `arms`
- `chest`
- `waist`
- `hips`
- `legs`
- `calves`
- `notes`

## ProgressPhoto

- `id`
- `progressEntryId`
- `type`
- `url`

Tipos:

- `front`
- `side`
- `back`

## CheckIn

- `id`
- `memberProfileId`
- `status`
- `submittedAt`
- `reviewedAt`
- `coachNotes`
- `memberNotes`
- `requestedPlanUpdate`

## ContentPage

- `id`
- `workspaceId`
- `title`
- `slug`
- `body`
- `status`

## SubscriptionPlan

- `id`
- `workspaceId`
- `name`
- `price`
- `currency`
- `billingInterval`
- `stripePriceId`

## Subscription

- `id`
- `memberProfileId`
- `subscriptionPlanId`
- `stripeSubscriptionId`
- `status`
- `currentPeriodEnd`

## CommunityChannel

- `id`
- `workspaceId`
- `name`
- `visibility`

## Message

- `id`
- `channelId`
- `authorUserId`
- `body`
- `attachmentUrl`
- `createdAt`
