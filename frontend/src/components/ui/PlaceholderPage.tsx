import Card from './Card';

export default function PlaceholderPage({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <Card className="max-w-2xl">
      <h1 className="text-2xl font-bold text-navy-900 dark:text-white">{title}</h1>
      <p className="mt-2 text-slate-500">
        {description || 'This section is ready for backend integration.'}
      </p>
    </Card>
  );
}
