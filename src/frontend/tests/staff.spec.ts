import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:5173';

test.describe('Fluxo E2E - Staff (Tratador)', () => {

  test('Deve fazer login, limpar uma box e concluir um cuidado canino qualquer', async ({ page }) => {

    page.on('dialog', async dialog => {
      console.log(`Pop-up automático aceite: ${dialog.message()}`);
      await dialog.accept().catch(() => {});
    });

    // 1. LOGIN
    await page.goto(`${BASE_URL}/`);
    await page.getByRole('banner').locator('svg').click({ force: true });

    await page.locator('input[type="text"]').first().fill('staff@auau.pt');
    await page.locator('input[type="password"]').first().fill('password123');
    await page.getByRole('button', { name: 'Login' }).click();

    await page.waitForTimeout(1500); 

    // 2. TAREFAS DE MANUTENÇÃO (Limpar Box)
    await page.getByRole('button', { name: 'Manutenção' }).click();
    await page.waitForTimeout(500); 
    
    // 3. CUIDADOS CANINOS (Grooming, Alimentação, Passeio, etc.)
    await page.getByRole('button', { name: '🐾 Cuidados Caninos' }).click();
    await page.waitForTimeout(500); 

    await page.getByText(/Cão:/i).first().click({ force: true });
    
    await page.waitForTimeout(500);

    // ========================================================
    // A MAGIA DO UPLOAD NO REACT
    // ========================================================
    
    // 1. Dizemos ao Playwright para ficar à espera que o ecrã de upload do sistema operativo tente abrir
    const fileChooserPromise = page.waitForEvent('filechooser');
    
    // 2. Clicamos no teu botão bonito (que vai acionar o input invisível)
    await page.getByRole('button', { name: 'Capturar Foto do Serviço' }).click();
    
    // 3. Capturamos o evento e injetamos o ficheiro diretamente nele!
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles({
      name: 'foto_servico.jpg',
      mimeType: 'image/jpeg',
      buffer: Buffer.from('imagem-falsa-em-memoria-para-teste-e2e')
    });
    
    await page.waitForTimeout(500);

    // Conclui a tarefa
    await page.getByRole('button', { name: '✓ Tarefa Concluída' }).click();

    // 4. LOGOUT
    await page.waitForTimeout(1500); 
    await page.getByRole('banner').locator('svg').click({ force: true });
    
  });
});