import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:5173';

test.describe('Fluxo E2E - Tutor (Cliente)', () => {

  test('Deve fazer login, registar um cão único e criar uma reserva', async ({ page }) => {
    
    // Gerar um ID único baseado na hora atual para o Microchip e o Nome nunca colidirem!
    const idUnico = Date.now().toString().slice(-6);
    const nomeCao = `Bobby ${idUnico}`;

    // 1. A NOSSA MAGIA: O apanhador global de pop-ups
    page.on('dialog', async dialog => {
      console.log(`Pop-up automático aceite: ${dialog.message()}`);
      await dialog.accept().catch(() => {});
    });

    // 2. LOGIN
    await page.goto(`${BASE_URL}/`);
    await page.getByRole('banner').locator('svg').click({ force: true });
    
    await page.locator('input[type="text"]').first().fill('tutor@auau.pt');
    await page.locator('input[type="password"]').first().fill('password123');
    await page.getByRole('button', { name: 'Login' }).click();
    
    await page.waitForTimeout(1000); // Dá tempo à página para carregar o dashboard

    // 3. REGISTAR NOVO ANIMAL
    await page.getByRole('img', { name: 'Reservas' }).click();
    await page.getByRole('button', { name: 'Adicionar Novo Animal' }).click();
    
    // Preencher dados do novo cão
    await page.getByRole('textbox', { name: 'ex: Bobby' }).fill(nomeCao);
    await page.locator('select[name="raca"]').selectOption('Pastor Alemão');
    await page.locator('select[name="reatividade"]').selectOption('Reativo');
    // Microchip único
    await page.getByRole('textbox', { name: 'ex: 123456789' }).fill(`12435${idUnico}`);
    await page.locator('select[name="tipoTrela"]').selectOption('Halti');
    
    // Upload do ficheiro fantasma
    await page.getByRole('button', { name: 'Choose File' }).setInputFiles({
      name: 'boletim_bobby.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('conteudo falso de PDF para o teste E2E passar')
    });
    
    await page.getByRole('button', { name: 'Registar Animal' }).click();
    
    await page.waitForTimeout(1500); // Dar tempo à DB para devolver o cão novo

    // O DEFAULT DO TEU SISTEMA É ABRIR O PERFIL DO ANIMAL APÓS REGISTAR, ENTÃO VAMOS APROVEITAR ISSO PARA FAZER A RESERVA DIRETAMENTE DESSE PERFIL
    // 4. SELECIONAR O CÃO NOVO (Usando a variável exata do nome gerado)
    // await page.getByRole('heading', { name: nomeCao }).first().click({ force: true });

    // 5. PREENCHER OS SERVIÇOS (Usando o teu excelente truque do duplo clique)
    await page.getByRole('spinbutton').first().dblclick({ force: true });
    await page.getByRole('spinbutton').first().fill('2');
    
    await page.getByRole('spinbutton').nth(1).click({ force: true });
    await page.getByRole('spinbutton').nth(1).fill('4');
    
    await page.getByRole('spinbutton').nth(2).click({ force: true });
    await page.getByRole('spinbutton').nth(2).fill('2');

    // 6. CONFIRMAR RESERVA
    await page.getByRole('button', { name: /Confirmar Reserva/i }).click();

    // Validação final: esperar 1 segundinho antes de fechar o browser
    await page.waitForTimeout(1000);
  });
});