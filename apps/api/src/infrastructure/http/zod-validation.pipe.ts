import { BadRequestException, type PipeTransform } from "@nestjs/common";
import type { ZodTypeAny } from "zod";

/** Validação de contrato HTTP com Zod (borda de infra; domínio continua com invariantes próprias). */
export class ZodValidationPipe implements PipeTransform {
  constructor(private readonly schema: ZodTypeAny) {}

  transform(value: unknown) {
    const parsed = this.schema.safeParse(value ?? {});
    if (!parsed.success) {
      const message = parsed.error.issues
        .map((issue) => issue.message)
        .join("; ");
      throw new BadRequestException(message || "Payload inválido");
    }
    return parsed.data;
  }
}
