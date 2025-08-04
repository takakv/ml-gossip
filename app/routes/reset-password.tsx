import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import React from "react";
import { argon2id } from "hash-wasm";

const formSchema = z.object({
  password: z.string().min(6, {
    message: "Salasõna peab olema vähemalt 6 tähemärki pikk.",
  }),
});

const toUnpaddedBase64 = (bytes: Uint8Array): string =>
  btoa(String.fromCharCode(...bytes)).replace(/=+$/, "");

const hexToBytes = (hex: string): Uint8Array =>
  new Uint8Array(hex.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16)));

const ResetPassword = () => {
  const [passwordHash, setPasswordHash] = React.useState<string | null>(null);
  const [copied, setCopied] = React.useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      password: "",
    },
  });

  const onFormSubmit = async (data: z.infer<typeof formSchema>) => {
    const salt = new Uint8Array(16);
    crypto.getRandomValues(salt);

    const hash = await argon2id({
      password: data.password.trim(),
      salt: salt,
      hashLength: 32,
      parallelism: 4,
      iterations: 3,
      memorySize: 65536,
    });

    const saltBase64 = toUnpaddedBase64(salt);
    const pwdBase64 = toUnpaddedBase64(hexToBytes(hash));
    const formattedHash = `$argon2id$v=19$m=65536,t=3,p=4$${saltBase64}$${pwdBase64}`;

    setPasswordHash(formattedHash);
  };

  return (
    <div className="h-screen w-full bg-radical-red-50 font-mono">
      <div className="h-full justify-center items-center flex flex-col gap-y-4 mx-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Lähtesta salasõna</CardTitle>
            <CardDescription>
              <p>Salasõna lähtestamiseks:</p>
              <ol className="list-decimal list-inside">
                <li>Siesta siia oma uus salasõna</li>
                <li>
                  Vajuta nupule: <q>Genereeri räsi</q>
                </li>
                <li>Saada meil räsiga aadressile taaniel [at] merelaager.ee</li>
              </ol>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onFormSubmit)}
                className="flex flex-col gap-4"
              >
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Uus salasõna</FormLabel>
                      <FormControl>
                        <Input {...field} type="password" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit">Genereeri räsi</Button>
              </form>
            </Form>
          </CardContent>
        </Card>
        {passwordHash && (
          <Card>
            <CardContent>
              <code className="break-all whitespace-pre-wrap text-sm">
                {passwordHash}
              </code>
            </CardContent>
            <CardFooter className="justify-end">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  navigator.clipboard.writeText(passwordHash);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1500);
                }}
              >
                {copied ? "Kopeeritud!" : "Kopeeri räsi"}
              </Button>
            </CardFooter>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;
