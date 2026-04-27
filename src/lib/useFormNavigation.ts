import { KeyboardEvent, useCallback } from "react";

export function useFormNavigation() {
  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLFormElement>) => {
    if (e.key === "Enter") {
      const target = e.target as HTMLElement;

      // 1. Exceção do Combobox (SearchableSelect)
      const isCombobox = target.getAttribute("role") === "combobox";
      const isExpanded = target.getAttribute("aria-expanded") === "true";
      // If dropdown is open, let Enter propagate so the search input can select the first option
      if (isCombobox && isExpanded) return;
      // If dropdown is closed, click to open it and stop
      if (isCombobox && !isExpanded) {
        e.preventDefault();
        target.click();
        return;
      }

      // 2. Lógica Aprimorada do Textarea (Observações)
      if (target.tagName === "TEXTAREA") {
        const textarea = target as HTMLTextAreaElement;

        // Se o campo de observações TIVER texto, permitimos que o Enter quebre a linha
        // (comportamento nativo). O código para aqui.
        if (textarea.value.trim() !== "") {
          return;
        }

        // Se estiver VAZIO, ignoramos o return acima e deixamos a função seguir para
        // a lógica de "avançar para o próximo campo" ali embaixo.
      }

      // 3. Lógica para Botões (+ Adicionar intervalo, Salvar, Cancelar)
      if (target.tagName === "BUTTON" && !isCombobox) {
        // Se o foco cair em um botão que não seja o de enviar o formulário (ex: "Adicionar intervalo"),
        // o Enter vai "clicar" nele e parar a execução.
        if (target.getAttribute("type") !== "submit") {
          e.preventDefault();
          target.click();
        }
        return;
      }

      // Previne o comportamento padrão (submissão ou quebra de linha indesejada)
      e.preventDefault();

      // Busca todos os elementos na ordem em que aparecem na tela
      const form = e.currentTarget;
      const focusableElements = Array.from(
        form.querySelectorAll<HTMLElement>(
          'input:not([disabled]), textarea:not([disabled]), button:not([disabled]), [role="combobox"]:not([disabled])'
        )
      );

      const currentIndex = focusableElements.indexOf(target);

      if (currentIndex > -1) {
        const nextDirection = e.shiftKey ? -1 : 1;
        let nextIndex = currentIndex + nextDirection;

        // Procura o próximo elemento válido na lista
        while (nextIndex >= 0 && nextIndex < focusableElements.length) {
          const nextEl = focusableElements[nextIndex];

          if (nextEl.tabIndex >= 0 && nextEl.offsetWidth > 0 && nextEl.offsetHeight > 0) {
            nextEl.focus();
            break;
          }
          nextIndex += nextDirection;
        }
      }
    }
  }, []);

  return handleKeyDown;
}
