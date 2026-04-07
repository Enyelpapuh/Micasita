package com.micasita.backend.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.sql.DataSource;
import java.sql.Connection;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/")
@CrossOrigin(origins = {"http://localhost:5127", "http://localhost:5173"})
public class Controller {

	private final DataSource dataSource;

	public Controller(DataSource dataSource) {
		this.dataSource = dataSource;
	}

	@GetMapping("/db-status")
	public ResponseEntity<Map<String, Object>> getDatabaseStatus() {
		Map<String, Object> response = new HashMap<>();

		try (Connection connection = dataSource.getConnection()) {
			boolean connected = !connection.isClosed();
			response.put("connected", connected);
			response.put("message", connected
					? "Conexion a la base de datos exitosa"
					: "No se pudo validar la conexion a la base de datos");
			return ResponseEntity.ok(response);
		} catch (Exception ex) {
			response.put("connected", false);
			response.put("message", "Error de conexion a la base de datos");
			response.put("error", ex.getMessage());
			return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(response);
		}
	}

}
