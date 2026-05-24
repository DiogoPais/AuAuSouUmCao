import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:5173';

test.describe('Fluxo E2E - Veterinário (Ações Independentes)', () => {

  // =========================================================================
  // FLUXO 1: PASSAR O CHECK DIÁRIO
  // =========================================================================
  
  test('Deve fazer login e finalizar um Check Diário com sucesso', async ({ page }) => {
    // Alerta global para este teste clicar sempre "OK"
    page.on('dialog', async dialog => {
      console.log(`[Check Diário] Pop-up aceite: ${dialog.message()}`);
      await dialog.accept().catch(() => {});
    });

    // 1. Login
    await page.goto(`${BASE_URL}/`);
    await page.getByRole('banner').locator('svg').click({ force: true });
    await page.locator('input[type="text"]').first().fill('vet@auau.pt');
    await page.locator('input[type="password"]').first().fill('password123');
    await page.getByRole('button', { name: 'Login' }).click();
    await page.waitForTimeout(1500);

    // 2. Abrir a verificação do primeiro cão disponível
    await page.getByRole('button', { name: 'Começar Verificação' }).first().click();
    await page.waitForTimeout(500);

    // 3. Escrever o comentário clínico (Usa o nome exato que o teu gravador apanhou)
    await page.getByRole('textbox', { name: 'Ex: Animal alerta, sem sinais' }).fill('Muito bem o animal');
    
    // 4. Finalizar o Check Diário carregando no Enter para submeter
    await page.getByRole('textbox', { name: 'Ex: Animal alerta, sem sinais' }).press('Enter');
    
    await page.waitForTimeout(1500); // Dar tempo para gravar na BD
  });
  

  // =========================================================================
  // FLUXO 2: PASSAR A PRESCRIÇÃO
  // =========================================================================
  test('Deve fazer login, ir ao separador de prescrições e adicionar um tratamento', async ({ page }) => {
    // Alerta global para este teste clicar sempre "OK"
    page.on('dialog', async dialog => {
      console.log(`[Prescrição] Pop-up aceite: ${dialog.message()}`);
      await dialog.accept().catch(() => {});
    });

    // 1. Login
    await page.goto(`${BASE_URL}/`);
    await page.getByRole('banner').locator('svg').click({ force: true });
    await page.locator('input[type="text"]').first().fill('vet@auau.pt');
    await page.locator('input[type="password"]').first().fill('password123');
    await page.getByRole('button', { name: 'Login' }).click();
    await page.waitForTimeout(1500);

    // 2. Entrar na área clínica clicando no primeiro cão disponível
    await page.getByRole('button', { name: 'Começar Verificação' }).first().click();
    await page.waitForTimeout(500);

    // 3. Mudar para a página/separador certa: "Prescrições e Tratamentos"
    await page.getByRole('button', { name: 'Prescrições e Tratamentos' }).click();
    await page.waitForTimeout(500);

    // 4. Selecionar o Cão dinamicamente (Index 1 escolhe o primeiro cão real que aparecer)
    await page.getByRole('combobox').first().selectOption({ index: 1 });

    // 5. Selecionar o Medicamento
    await page.getByRole('combobox').nth(1).selectOption({ index: 1 }); // Seleciona o primeiro medicamento disponível

    // 6. Preencher os detalhes (Dosagem, Doses Totais e Frequência)
    await page.getByPlaceholder('Ex: 1', { exact: true }).fill('1');
    await page.getByPlaceholder('Ex: 10').fill('2');
    await page.getByRole('textbox', { name: 'Ex: 12/12h' }).fill('12/12h');

    // 7. Clicar no botão final para adicionar à lista e submeter
    await page.getByRole('button', { name: '+ Adicionar à Lista' }).click();

    await page.waitForTimeout(1500); // Dar tempo para processar
  });

});