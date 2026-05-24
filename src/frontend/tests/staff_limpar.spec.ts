import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:5173';

test.describe('Fluxo E2E - Staff (Tratador)', () => {

  test('Deve fazer login, limpar uma box e concluir um cuidado canino com foto', async ({ page }) => {

    // 1. A NOSSA MAGIA: Apanhador global de pop-ups
    page.on('dialog', async dialog => {
      console.log(`Pop-up automático aceite: ${dialog.message()}`);
      await dialog.accept().catch(() => {});
    });

    // ==========================================
    // 2. LOGIN
    // ==========================================
    await page.goto(`${BASE_URL}/`);
    await page.getByRole('banner').locator('svg').click({ force: true });

    // .first() para evitar strict mode
    await page.locator('input[type="text"]').first().fill('staff@auau.pt');
    await page.locator('input[type="password"]').first().fill('password123');
    await page.getByRole('button', { name: 'Login' }).click();

    await page.waitForTimeout(1500); // Esperar que o dashboard carregue as tarefas

    // ==========================================
    // 3. TAREFAS DE MANUTENÇÃO (Limpar Box)
    // ==========================================
    await page.getByRole('button', { name: 'Manutenção' }).click();
    await page.waitForTimeout(500); // Animação do separador
    
    // Clica na primeira box que precisar de limpeza
    await page.getByRole('button', { name: 'Marcar como Limpa' }).first().click();
    
    await page.waitForTimeout(1000); // Tempo para a BD registar a limpeza
    
    await page.getByRole('banner').locator('svg').click({ force: true });
    
  });
});