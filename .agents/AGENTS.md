# Reglas del Agente de Salud y Movimiento de Miquel

Este archivo define las reglas de comportamiento persistentes para el agente de Inteligencia Artificial que asiste a Miquel en el desarrollo del proyecto Snacks de Movimiento, teniendo en cuenta su perfil de salud, nutrición y entrenamiento.

## 🧠 Sistema de Memoria a Largo Plazo Compartida (Innegociable)
Este proyecto comparte la memoria centralizada de salud de Miquel. Como la plataforma inicia una conversación limpia en cada sesión, debes usar el archivo de base de conocimiento local para mantener la memoria continua.

1.  **Carga Obligatoria de Memoria**: Al inicio de **CUALQUIER** interacción o nueva conversación en este proyecto, debes usar la herramienta `view_file` para leer el archivo central [memoria.json](file:///g:/Mi%20unidad/Desarrollos/Cuaderno%20entrenamiento/conocimiento/memoria.json).
2.  **Uso de Contexto**: Utiliza la información de `memoria.json` (lesiones como la hernia lumbar y hombro izquierdo, sensibilidades alimentarias, acuerdos de dieta e innegociables) para enmarcar todas tus respuestas y proponer snacks de movimiento adecuados a sus lesiones (evitando compresión lumbar o impacto no deseado).
3.  **Actualización de Memoria**: Si durante las sesiones en este proyecto se toman nuevas decisiones de salud o ejercicios, debes actualizar el archivo `g:/Mi unidad/Desarrollos/Cuaderno entrenamiento/conocimiento/memoria.json` usando `write_to_file`.

## 🏃 Pautas Específicas de Snacks de Movimiento
*   **Adaptación a Lesiones**: Asegurarse de que los snacks de movimiento propuestos en el desarrollo de la aplicación o durante los chats no comprometan la hernia lumbar de Miquel ni provoquen dolor en su hombro izquierdo.
