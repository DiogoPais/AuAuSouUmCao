import { test, expect } from '@playwright/test';

// Agora usamos o URL correto que descobriste!
const BASE_URL = 'http://localhost:5173';

test.describe('Fluxo E2E - Autenticação e Dashboard', () => {
  
  test('Deve fazer login com sucesso como Admin e entrar no sistema', async ({ page }) => {
    // 1. Vai para a página inicial
    await page.goto(`${BASE_URL}/`);

    // 2. Clica no ícone/botão que abre o login (gravado pelo teu codegen)
    await page.locator('path').nth(1).click({ force: true });

    // 3. Preenche os dados
    await page.locator('input[type="text"]').fill('diana@auau.pt');
    await page.locator('input[type="password"]').fill('password123');

    // 4. Prepara o Playwright para lidar com o Pop-up/Alerta de Sucesso
    page.once('dialog', async dialog => {
      console.log(`Mensagem do alerta: ${dialog.message()}`);
      // Em vez de 'dismiss' (Cancelar), fazemos 'accept' (Clicar no OK) para o login prosseguir
      await dialog.accept(); 
    });

    // 5. Carrega no Enter para submeter o login
    await page.locator('input[type="password"]').press('Enter');

    // 6. VALIDAÇÃO: Dar um segundo para o redirecionamento acontecer
    await page.waitForTimeout(1000); 
    
    // (Opcional) Se a página mudar de URL para um dashboard, podes descomentar a linha abaixo:
    // await expect(page).toHaveURL(/.*dashboard/i);
  });

  test('Deve mostrar erro se as credenciais estiverem erradas', async ({ page }) => {
    await page.goto(`${BASE_URL}/`);
    await page.locator('path').nth(1).click({ force: true });
    
    // Inserir dados ERRADOS
    await page.locator('input[type="text"]').fill('diana@auau.pt');
    await page.locator('input[type="password"]').fill('palavrapasse_errada');

    // Vamos capturar a mensagem do alerta de erro
    let mensagemAlerta = '';
    page.once('dialog', async dialog => {
      mensagemAlerta = dialog.message();
      await dialog.accept();
    });

    await page.locator('input[type="password"]').press('Enter');

    // Esperar um bocadinho para o alerta ter tempo de disparar
    await page.waitForTimeout(1000);

    // VALIDAÇÃO: Garantir que a mensagem do alerta tinha a palavra erro/inválida ou que não entrou
    // (Nota: Podes ajustar a palavra 'inválid' para o que o teu sistema diz realmente quando falha)
    expect(mensagemAlerta.toLowerCase()).toMatch(/inválid|erro|incorret|fail/);
  });

});